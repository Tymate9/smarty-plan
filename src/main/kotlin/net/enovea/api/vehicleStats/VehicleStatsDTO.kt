package net.enovea.api.vehicleStats

data class VehicleStatsDTO(
    val vehicleId : String,
    val tripCount: Int,
    val distanceSum: Double?,
    val drivingTime: Long?,
    val distancePerTripAvg: Double?,
    val durationPerTripAvg: Long?,
    val hasLateStartSum: Int,
    val hasLateStop:Int ,
    val hasLastTripLong: Int,
    val rangeAvg: Int,
    val waitingDuration: Long?,

)