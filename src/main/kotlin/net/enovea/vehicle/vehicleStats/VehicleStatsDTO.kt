package net.enovea.vehicle.vehicleStats

import net.enovea.team.TeamDTO

data class VehicleStatsDTO(
    val tripDate: java.time.LocalDate?,
    val vehicleId: String?,
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
    var licensePlate: String? = null,
    var driverName: String? = null,
    )

data class VehiclesStatsDTO(
    val vehicleStats: VehicleStatsDTO,
    var team: TeamDTO?,
    var teamHierarchy:String?

)

data class VehicleStatsQseDTO(
    val tripDate: java.time.LocalDate?,
    val vehicleId: String?,
    val tripCount: Int,
    val distanceSum: Int?,
    val drivingTime: String?,
    val durationPerTripAvg: String?,
    val waitingDuration: String?,
    var licensePlate: String? = null,
    var driverName: String? = null,
    //TODO A changer les noms des variables suivants
    var accelerationAR: Int? = 18,
    var accelerationR: Int? = 15,
    var accelerationV: Int? = 19,

    var turnAR: Int? = 15,
    var turnR: Int? = 20,
    var turnV: Int? = 17,

    var speedAR: Int? = 90,
    var speedR: Int? = 70,
    var speedV: Int? = 50
)
data class VehiclesStatsQseDTO(
    val vehicleStatsQse: VehicleStatsQseDTO,
    var team: TeamDTO?,
    var teamHierarchy:String?

)
