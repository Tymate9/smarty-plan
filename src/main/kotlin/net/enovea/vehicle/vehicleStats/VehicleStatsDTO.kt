package net.enovea.vehicle.vehicleStats

import net.enovea.team.TeamDTO

data class VehicleStatsQueryResult(
    val tripDate: java.time.LocalDate?,
    val vehicleId: String?,
    val tripCount: Int,
    val distanceSum: Int?,
    val drivingTime: Long?,
    val distancePerTripAvg: Int?,
    val durationPerTripAvg: Long?,
    val hasLateStartSum: Int,
    val hasLateStop: Int,
    val hasLastTripLong: Int,
    val rangeAvg: Long?,
    val waitingDuration: Long?,
    var licensePlate: String? = null,
    var driverName: String? = null,
    )

data class VehicleStatsDTO(
    val tripDate: java.time.LocalDate?,
    val vehicleId: String?,
    val tripCount: Int,
    val distanceSum: String,
    val drivingTime: String,
    val distancePerTripAvg: String,
    val durationPerTripAvg: String,
    val hasLateStartSum: Int,
    val hasLateStop:Int,
    val hasLastTripLong: Int,
    val rangeAvg: String,
    val waitingDuration: String,
    var licensePlate: String? = null,
    var driverName: String? = null,
)

data class VehiclesStatsDTO(
    val vehicleStats: VehicleStatsDTO,
    var team: TeamDTO?,
    var teamHierarchy:String?
)

data class VehicleStatsQseQueryResult(
    val tripDate: java.time.LocalDate?,
    val vehicleId: String?,
    val tripCount: Int,
    val distanceSum: Int?,
    val highwayDistanceSum: Int?,
    val roadDistanceSum: Int?,
    val cityDistanceSum: Int?,

    val distanceMax: Int?,
    val drivingTime: Long?,
    val durationPerTripAvg: Long?,
    val waitingDuration: Long?,
    val rangeAvg: Long?,
    var licensePlate: String? = null,
    var driverName: String? = null,
    val idleDuration: Long?,

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


data class VehicleStatsQseDTO(
    val tripDate: java.time.LocalDate?,
    val vehicleId: String?,
    val tripCount: Int,
    val distanceSum: String,
    val highwayDistanceSum: String,
    val roadDistanceSum: String,
    val cityDistanceSum: String,

    val distanceMax: String,
    val drivingTime: String,
    val durationPerTripAvg: String,
    val waitingDuration: String,
    val rangeAvg: String,
    var licensePlate: String? = null,
    var driverName: String? = null,
    val idleDuration: String,

    var highwayAccelScore: String,
    var roadAccelScore: String,
    var cityAccelScore: String,

    var highwayTurnScore: String,
    var roadTurnScore: String,
    var cityTurnScore: String,

    var highwaySpeedScore: String,
    var roadSpeedScore: String,
    var citySpeedScore: String
)

data class VehiclesStatsQseDTO(
    val vehicleStatsQse: VehicleStatsQseDTO,
    var team: TeamDTO?,
    var teamHierarchy:String?
)
