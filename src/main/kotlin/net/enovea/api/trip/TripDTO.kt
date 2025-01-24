package net.enovea.api.trip

import java.time.LocalDateTime
import java.time.LocalTime

data class TripDTO(
    val vehicleId: String,
    val tripId: String,
    val lastComputeDate: LocalDateTime,
    val startTime: LocalDateTime,
    val endTime: LocalDateTime,
    val distance: Double?,
    val duration: Long?,
    val datapointCount: Long?,
    val startLng: Double,
    val startLat: Double,
    val endLng: Double,
    val endLat: Double,
    val idleCount: Int,
    val idleDuration: Long,
    val tripStatus: TripStatus,
    val trace: String?,
)


enum class TripStatus(
    val value: Int
) {
    DRIVING(0),
    COMPLETED(1),
    IDLE(2)
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
    val vehicleCategory: String,
    val range: Int,
    val stopDuration: Long,
    val drivingDuration: Long,
    val tripAmount: Int,
    val idleDuration: Long,
    val drivingDistance: Double,
    val poiAmount: Int,
    val tripEvents: List<TripEventDTO>,
    val compactedTripEvents: List<TripEventDTO>
)

enum class TripEventType {
    TRIP,
    TRIP_EXPECTATION,
    STOP,
    VEHICLE_RUNNING,
    VEHICLE_IDLE,
}

data class TripEventDTO(
    val index: Int,
    val eventType: TripEventType,
    val distance: Double? = null,
    val color: String? = null,
    val poiId: Int? = null,
    val poiLabel: String? = null,
    val address: String? = null,
    val start: LocalDateTime? = null,
    val end: LocalDateTime? = null,
    val duration: Long? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val trace: String? = null,
    val sourceIndexes: List<Int>? = null
)