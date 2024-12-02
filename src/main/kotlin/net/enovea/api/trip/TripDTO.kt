package net.enovea.api.trip

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
)

data class TripEventsDTO(
    val vehicleId: String,
    val range: Int,
    val stopDuration: Long,
    val drivingDuration: Long,
    val tripAmount: Int,
    val drivingDistance: Double,
    val poiAmount: Int,
    val tripEvents: List<TripEventDTO>,
)

enum class TripEventType {
    TRIP,
    STOP
}

data class TripEventDTO(
    val index: Int,
    val eventType: TripEventType,
    val distance: Double?,
    val color: String?,
    val poiId: Int?,
    val poiLabel: String?,
    val address: String?,
    var start: LocalDateTime? = null,
    var end: LocalDateTime? = null,
    var duration: Long? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val wktTrace: String? = null,
)