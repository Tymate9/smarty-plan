package net.enovea.domain.vehicle

data class VehicleDTO (
    val id: Int,
    val energy: String,
    val engine: String,
    val externalId: String,
    //validated ??
    val vehicleServices: List<VehicleServiceDTO>,
    val vehicleDrivers: List<VehicleDriver>
)

