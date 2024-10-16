package net.enovea.domain.service

import net.enovea.domain.vehicle.VehicleServiceDTO

data class ServiceDTO (
    val id : Int,
    val label: String,
    val vehicleService: List<VehicleServiceDTO>
)