package net.enovea.vehicle.vehicleStats

import net.enovea.team.TeamDTO

data class VehicleStatsDTO(
    val vehicleId : String?,
    val tripCount: Int,
    val distanceSum: Double?,
    val drivingTime: Long?,
    val distancePerTripAvg: Double?,
    val durationPerTripAvg: Long?,
    val hasLateStartSum: Int,
    val hasLateStop:Int,
    val hasLastTripLong: Int,
    val rangeAvg: Int,
    val waitingDuration: Long?,
    var licensePlate : String? = null,
    var driverName : String? = null,


    )

data class VehiclesStatsDTO(
    var licensePlate: String? = null,
    var driverName: String? = null,
    val tripCount: Int,
    val distanceSum: Int?,
    val drivingTime: String?,
    val distancePerTripAvg: Int?,
    val durationPerTripAvg: String?,
    val hasLateStartSum: Int,
    val hasLateStop:Int,
    val hasLastTripLong: Int,
    val rangeAvg: String,
    val waitingDuration: String?,
    var team: TeamDTO?,
    var teamHierarchy:String?

    )