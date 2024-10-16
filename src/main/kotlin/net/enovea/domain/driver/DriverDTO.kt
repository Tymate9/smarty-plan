package net.enovea.domain.driver

import net.enovea.domain.vehicle.VehicleDriver

data class DriverDTO (
    val id : Int,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String,
    val allowsLocalization: Boolean,
    val vehicleDrivers: List<VehicleDriver>
)