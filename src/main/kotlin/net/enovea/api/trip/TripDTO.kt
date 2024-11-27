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
    var lastTripEnd: LocalDateTime? = null,
    var startDuration: Long? = 0,
    var poiAtStart: PointOfInterestEntity? = null,
    var addressAtStart: String? = null,
    var poiAtEnd: PointOfInterestEntity? = null,
    var addressAtEnd: String? = null
)

data class TripMapDTO(
    val vehicleId: String,
    val range: Int,
    val tripAmount: Int,
    val stopDuration: Long,
    val drivingDuration: Long,
    val drivingDistance: Double,
    val poiAmount: Int,
    val trips: List<TripDTO>,
    var poiAtEnd: PointOfInterestEntity? = null,
    var addressAtEnd: String? = null
)