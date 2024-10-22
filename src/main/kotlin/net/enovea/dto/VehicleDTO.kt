package net.enovea.dto

import java.sql.Timestamp

data class VehicleDTO (
    val id: String,
    val energy: String?,
    val engine: String?,
    val externalId: String?,
    val licenseplate:String?,
    val validated:Boolean?,

    //val vehicleServices: List<VehicleServiceDTO>,
    val drivers: Map<ClosedRange<Timestamp> ,DriverDTO>?
)

