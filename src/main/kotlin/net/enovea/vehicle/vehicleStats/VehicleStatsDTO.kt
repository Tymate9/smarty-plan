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
    val distanceMax: Int?,
    val drivingTime: String?,
    val durationPerTripAvg: String?,
    val waitingDuration: String?,
    val rangeAvg: String,
    var licensePlate: String? = null,
    var driverName: String? = null,
    val idleDuration: String?,

    var accelScore : Int? = null,

    var highwayAccelScore: Int? = null,
    var roadAccelScore: Int? = null,
    var cityAccelScore: Int? = null,

    var turnScore : Int? = null,

    var highwayTurnScore: Int? = null,
    var roadTurnScore: Int? = null,
    var cityTurnScore: Int? = null,

    var highwaySpeedScore: Int? = null,
    var roadSpeedScore: Int? = null,
    var citySpeedScore: Int? = null
)
data class VehiclesStatsQseDTO(
    val vehicleStatsQse: VehicleStatsQseDTO,
    var team: TeamDTO?,
    var teamHierarchy:String?

)
