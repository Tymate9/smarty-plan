package net.enovea.api.trip

import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.SpatialService
import net.enovea.domain.vehicle.VehicleDriverEntity
import net.enovea.repository.TripRepository
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.LineString
import org.locationtech.jts.geom.Point
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter.BASIC_ISO_DATE

class TripService(
    private val tripRepository: TripRepository,
    private val spatialService: SpatialService<PointOfInterestEntity>
) {

    fun computeTripEventsDTO(vehicleId: String, date: String): TripEventsDTO? {
        val parsedDate = LocalDate.parse(date, BASIC_ISO_DATE)

        // check if the driver at that date on this vehicle can be localized
        // if yes, get his informations, if no, cancel
        val vehicleDriver = VehicleDriverEntity.getForVehicleAtDateIfTracked(vehicleId, parsedDate)
            ?: return null

        val trips = tripRepository.findByVehicleIdAndDate(
            vehicleId,
            parsedDate
        )

        if (trips.isEmpty()) {
            return null
        }
        val geometryFactory = GeometryFactory()

        // compute events for each trip and stop between each trip
        val tripEvents = trips
            .reversed()
            .windowed(2, partialWindows = true)
            .reversed()
            // ^ this allows to have each trip with its preceding trip (if any) in the same window
            .flatMapIndexed { index, trips ->
                val trip = trips.first()
                val precedingTrip = trips.getOrNull(1)
                val startPoint = geometryFactory.createPoint(Coordinate(trip.startLng, trip.startLat))
                val poiAtStart = spatialService.getNearestEntityWithinArea(startPoint)
                val addressAtStart = if (poiAtStart == null) {
                    spatialService.getAddressFromEntity(startPoint)
                } else null
                listOf(
                    TripEventDTO(
                        index = index * 2,
                        eventType = TripEventType.STOP,
                        lat = poiAtStart?.coordinate?.y ?: trip.startLat,
                        lng = poiAtStart?.coordinate?.x ?: trip.startLng,
                        color = poiAtStart?.category?.color ?: "black",
                        poiId = poiAtStart?.id,
                        poiLabel = poiAtStart?.getDenomination(),
                        address = addressAtStart ?: poiAtStart?.address,
                        duration = precedingTrip?.let {
                            trip.startTime.toEpochSecond(ZoneOffset.of("Z")) - it.endTime.toEpochSecond(
                                ZoneOffset.of("Z")
                            )
                        },
                        start = precedingTrip?.endTime,
                        end = trip.startTime
                    ),
                    TripEventDTO(
                        index = index * 2 + 1,
                        eventType = TripEventType.TRIP,
                        distance = trip.distance?.div(1000),
                        duration = trip.duration,
                        start = trip.startTime,
                        end = trip.endTime,
                        trace = trip.trace,
                    )
                )
            }.toMutableList()

        // compute last trip event (either stop, vehicle running or vehicle idle)
        val lastTrip = trips.last()
        var lastTripStatus = lastTrip.tripStatus
        var lastPosition: Point? = null
        var lastPositionTime = lastTrip.endTime
        var poiAtEnd: PointOfInterestEntity? = null
        var addressAtEnd: String? = null
        val lastDeviceState = if (parsedDate == LocalDate.now()) // don't get device state if date isn't today
            vehicleDriver.vehicle!!.vehicleDevices.firstOrNull {
                !listOf("PARKED", null).contains(it.device!!.deviceDataState?.state)
            }?.device?.deviceDataState
        else null
        if (lastDeviceState == null) {
            // if no device state, compute end POI/address
            lastPosition = geometryFactory.createPoint(Coordinate(lastTrip.endLng, lastTrip.endLat))
            poiAtEnd = spatialService.getNearestEntityWithinArea(lastPosition)
            if (poiAtEnd == null)
                addressAtEnd = spatialService.getAddressFromEntity(lastPosition)
        } else {
            // if device state, add trip expectation
            lastPosition = lastDeviceState.coordinate
            if (lastDeviceState.lastPositionTime != null) {
                lastPositionTime = lastDeviceState.lastPositionTime!!.toLocalDateTime()
            }
            lastTripStatus = when (lastDeviceState.state) {
                "DRIVING" -> TripStatus.DRIVING
                "IDLE" -> TripStatus.IDLE
                else -> throw NotImplementedError("Unknown device state ${lastDeviceState.state}")
            }
            tripEvents.add(
                TripEventDTO(
                    index = tripEvents.size,
                    eventType = TripEventType.TRIP_EXPECTATION,
                    trace = geometryFactory.createLineString(
                        arrayOf(
                            Coordinate(lastTrip.endLng, lastTrip.endLat),
                            lastPosition?.coordinate
                        )
                    ).toText()
                )
            )
        }
        tripEvents.add(
            TripEventDTO(
                index = tripEvents.size,
                eventType = when (lastTripStatus) {
                    TripStatus.COMPLETED -> TripEventType.STOP
                    TripStatus.DRIVING -> TripEventType.VEHICLE_RUNNING
                    TripStatus.IDLE -> TripEventType.VEHICLE_IDLE
                },
                color = poiAtEnd?.category?.color ?: "black",
                poiId = poiAtEnd?.id,
                poiLabel = poiAtEnd?.getDenomination(),
                address = addressAtEnd ?: poiAtEnd?.address,
                lat = lastPosition?.y ?: lastTrip.endLat,
                lng = lastPosition?.x ?: lastTrip.endLng,
                start = lastPositionTime,
            )
        )

        return TripEventsDTO(
            vehicleId = vehicleId,
            licensePlate = vehicleDriver.vehicle!!.licenseplate,
            driverName = "${vehicleDriver.driver!!.firstName} ${vehicleDriver.driver!!.lastName}",
            range = lastTrip.endTime.toEpochSecond(ZoneOffset.of("Z")).toInt()
                    - trips.first().startTime.toEpochSecond(ZoneOffset.of("Z")).toInt(),
            tripAmount = trips.size,
            stopDuration = tripEvents.filter { it.eventType == TripEventType.STOP }.sumOf { it.duration ?: 0 },
            drivingDuration = trips.sumOf { it.duration ?: 0 },
            drivingDistance = trips.sumOf { it.distance ?: 0.0 } / 1000,
            poiAmount = tripEvents.count { it.poiId != null } + (poiAtEnd?.let { 1 } ?: 0),
            tripEvents = tripEvents,
        )
    }

    fun getTripDailyStats(): Map<String, TripDailyStats> {
        return tripRepository.aggregateDailyStats()
            .associate { it.vehicleId to TripDailyStats(it.distance, it.firstTripStart) }
    }
}