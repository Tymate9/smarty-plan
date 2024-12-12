package net.enovea.api.trip

import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.SpatialService
import net.enovea.repository.TripRepository
import net.enovea.service.VehicleService
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter.BASIC_ISO_DATE

class TripService(
    private val tripRepository: TripRepository,
    private val spatialService: SpatialService<PointOfInterestEntity>,
    private val vehicleService: VehicleService
) {

    fun computeTripEventsDTO(vehicleId: String, date: String): TripEventsDTO? {
        val parsedDate = LocalDate.parse(date, BASIC_ISO_DATE)

        // check if the driver at that date on this vehicle can be localized
        // if yes, get his informations, if no, cancel
        val (licensePlate, driverName) = vehicleService.getVehicleDriverDetailsOnDayIfTracked(vehicleId, parsedDate)
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
                        distance = null,
                        lat = poiAtStart?.coordinate?.y ?: trip.startLat,
                        lng = poiAtStart?.coordinate?.x ?: trip.startLng,
                        color = poiAtStart?.category?.color ?: "black",
                        poiId = poiAtStart?.id,
                        poiLabel = poiAtStart?.getDenomination(),
                        address = addressAtStart ?: poiAtStart?.address,
                        duration = precedingTrip?.let {
                            trip.startDate.toEpochSecond(ZoneOffset.of("Z")) - it.endDate.toEpochSecond(
                                ZoneOffset.of("Z")
                            )
                        },
                        start = precedingTrip?.endDate,
                        end = trip.startDate
                    ),
                    TripEventDTO(
                        index = index * 2 + 1,
                        eventType = TripEventType.TRIP,
                        distance = trip.distance,
                        duration = trip.duration,
                        start = trip.startDate,
                        end = trip.endDate,
                        wktTrace = trip.wktTrace,
                        color = null,
                        poiId = null,
                        poiLabel = null,
                        address = null
                    )
                )
            }.toMutableList()

        // compute last trip event (either stop, vehicle running or vehicle idle)
        val lastTrip = trips.last()
        var poiAtEnd: PointOfInterestEntity? = null
        var addressAtEnd: String? = null
        if (lastTrip.tripStatus == TripStatus.COMPLETED) {
            // if stop, compute end POI/address
            val endPoint = geometryFactory.createPoint(Coordinate(lastTrip.endLng, lastTrip.endLat))
            poiAtEnd = spatialService.getNearestEntityWithinArea(endPoint)
            if (poiAtEnd == null)
                addressAtEnd = spatialService.getAddressFromEntity(endPoint)
        }
        tripEvents.add(
            TripEventDTO(
                index = tripEvents.size,
                eventType = when (lastTrip.tripStatus) {
                    TripStatus.COMPLETED -> TripEventType.STOP
                    TripStatus.RUNNING -> TripEventType.VEHICLE_RUNNING
                    TripStatus.IDLE -> TripEventType.VEHICLE_IDLE
                },
                distance = null,
                color = poiAtEnd?.category?.color ?: "black",
                poiId = poiAtEnd?.id,
                poiLabel = poiAtEnd?.getDenomination(),
                address = addressAtEnd ?: poiAtEnd?.address,
                lat = poiAtEnd?.coordinate?.y ?: lastTrip.endLat,
                lng = poiAtEnd?.coordinate?.x ?: lastTrip.endLng,
                duration = null,
                start = lastTrip.endDate,
                end = null
            )
        )

        return TripEventsDTO(
            vehicleId = vehicleId,
            licensePlate = licensePlate,
            driverName = driverName,
            range = lastTrip.endDate.toEpochSecond(ZoneOffset.of("Z")).toInt()
                    - trips.first().startDate.toEpochSecond(ZoneOffset.of("Z")).toInt(),
            tripAmount = trips.size,
            stopDuration = tripEvents.filter { it.eventType == TripEventType.STOP }.sumOf { it.duration ?: 0 },
            drivingDuration = trips.sumOf { it.duration ?: 0 },
            drivingDistance = trips.sumOf { it.distance ?: 0.0 },
            poiAmount = tripEvents.count { it.poiId != null } + (poiAtEnd?.let { 1 } ?: 0),
            tripEvents = tripEvents,
        )
    }

    fun getTripDailyStats(): Map<String, TripDailyStats> {
        return tripRepository.aggregateDailyStats()
            .associate { it.vehicleId to TripDailyStats(it.distance, it.firstTripStart) }
    }
}