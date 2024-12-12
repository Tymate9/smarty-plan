package net.enovea.api.trip

import java.time.LocalDateTime
import java.time.LocalTime

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
    val tripStatus: TripStatus,
    val trace: String?,
    val wktTrace: String?,
)

enum class TripStatus(
    val value: String
) {
    COMPLETED("COMPLETED"),
    RUNNING("RUNNING"),
    IDLE("IDLE")
}

data class TripDailyStatsDTO(
    val vehicleId: String,
    val distance: Double,
    val firstTripStart: LocalTime?,
)

data class TripDailyStats(
    val distance: Double,
    val firstTripStart: LocalTime?,
)

data class TripEventsDTO(
    val vehicleId: String,
    val licensePlate: String,
    val driverName: String,
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
    STOP,
    VEHICLE_RUNNING,
    VEHICLE_IDLE
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