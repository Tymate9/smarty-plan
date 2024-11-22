package net.enovea.api.trip

import net.enovea.api.poi.PointOfInterestEntity
import java.time.LocalDateTime

data class TripDTO(
    val vehicleId: String,
    val tripId: String,
    val computeDate: LocalDateTime,
    val startDate: LocalDateTime,
    val endDate: LocalDateTime,
    val distance: Double?,
    val duration: Long?,
    val datapoints: Long?,
    val startLng: Double,
    val startLat: Double,
    val endLng: Double,
    val endLat: Double,
    val trace: String?,
    val wktTrace: String?,
    var poiAtStart: PointOfInterestEntity? = null,
    var addressAtStart: String? = null,
    var poiAtEnd: PointOfInterestEntity? = null,
    var addressAtEnd: String? = null
)