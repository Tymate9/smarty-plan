package net.enovea.domain.vehicle

import net.enovea.domain.driver.DriverEntity

data class VehicleDriverDTO (
    val id: VehicleDriverId,
    val vehicle: VehicleEntity,
    val driver: DriverEntity
)