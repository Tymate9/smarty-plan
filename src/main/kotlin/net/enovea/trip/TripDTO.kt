package net.enovea.trip

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
    IDLE(2),
    PARKED(3),
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
    VEHICLE_PARKED
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
    val tripStatus: TripStatus? = null,
    val trace: List<String?>? = null,
    val sourceIndexes: List<Int>? = null,
    val tripEventDetails: List<TripEventDetails>? = null,
)

data class DatapointDTO(
    val timestamp: LocalDateTime,
    val deviceId: Int,
    val tripId: Int,
    val locationLat: Double,
    val locationLng: Double
)

data class TripEventDetails(
    val lat: Double? = null,
    val lng: Double? = null,
    val timestamp: LocalTime? = null,
    val type: TripEventDetailsType,
    val description : String? = null
)

enum class TripEventDetailsType {
    START_LUNCH_BREAK,
    END_LUNCH_BREAK,
    LUNCH_BREAKING,
}