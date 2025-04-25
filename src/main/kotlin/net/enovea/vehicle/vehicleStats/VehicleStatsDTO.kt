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

    var highwayAccel: Int? = 18,
    var roadAccel: Int? = 15,
    var cityAccel: Int? = 19,

    var highwayTurn: Int? = 15,
    var roadTurn: Int? = 20,
    var cityTurn: Int? = 17,

    var highwaySpeed: Int? = 90,
    var roadSpeed: Int? = 70,
    var citySpeed: Int? = 50
)
data class VehiclesStatsQseDTO(
    val vehicleStatsQse: VehicleStatsQseDTO,
    var team: TeamDTO?,
    var teamHierarchy:String?

)
