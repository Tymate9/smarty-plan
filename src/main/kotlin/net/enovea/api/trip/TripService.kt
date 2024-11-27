package net.enovea.api.trip

import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.SpatialService
import net.enovea.repository.TripRepository
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter.BASIC_ISO_DATE

class TripService(
    private val tripRepository: TripRepository,
    private val spatialService: SpatialService<PointOfInterestEntity>
) {

    fun computeTripMapDTO(vehicleId: String, date: String): TripMapDTO {

        val geometryFactory = GeometryFactory()

        // compute start POI/address for each trip and difference between each
        val trips = tripRepository.findByVehicleIdAndDate(
            vehicleId,
            LocalDate.parse(date, BASIC_ISO_DATE)
        ).map { trip ->
            val startPoint = geometryFactory.createPoint(Coordinate(trip.startLng, trip.startLat))
            trip.poiAtStart = spatialService.getNearestEntityWithinRadius(startPoint, 100.0)
            if (trip.poiAtStart == null) {
                trip.addressAtStart = spatialService.getAddressFromEntity(startPoint)
            }
            trip
        }.let {
            // compute start duration for each trip
            it.zipWithNext().forEach { (start, end) ->
                end.lastTripEnd = start.endDate
                end.startDuration =
                    end.startDate.toEpochSecond(ZoneOffset.of("Z")) - start.endDate.toEpochSecond(ZoneOffset.of("Z"))
            }
            it
        }

        // compute end POI/address for last trip
        val endPoint = geometryFactory.createPoint(Coordinate(trips.last().endLng, trips.last().endLat))
        val poiAtEnd = spatialService.getNearestEntityWithinRadius(endPoint, 100.0)
        val addressAtEnd = if (poiAtEnd == null) spatialService.getAddressFromEntity(endPoint) else null
        return TripMapDTO(
            vehicleId = vehicleId,
            range = trips.last().endDate.toEpochSecond(ZoneOffset.of("Z")).toInt()
                    - trips.first().startDate.toEpochSecond(ZoneOffset.of("Z")).toInt(),
            tripAmount = trips.size,
            stopDuration = trips.sumOf { it.startDuration ?: 0 },
            drivingDuration = trips.sumOf { it.duration ?: 0 },
            drivingDistance = trips.sumOf { it.distance ?: 0.0 },
            poiAmount = trips.count { it.poiAtStart != null } + (poiAtEnd?.let { 1 } ?: 0),
            trips = trips,
            poiAtEnd = poiAtEnd,
            addressAtEnd = addressAtEnd
        )
    }
}