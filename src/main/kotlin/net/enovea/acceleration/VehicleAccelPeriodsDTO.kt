package net.enovea.acceleration

import net.enovea.vehicle.VehicleDTO

data class VehicleAccelPeriodsDTO (
    val vehicle: VehicleDTO,
    val periods: List<DeviceAccelAnglesDTO>,
)
