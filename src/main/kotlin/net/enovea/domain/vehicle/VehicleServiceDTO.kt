package net.enovea.domain.vehicle

import net.enovea.domain.service.ServiceEntity

data class VehicleServiceDTO (
    val id: VehicleServiceId,
    val vehicle: VehicleEntity,
    val service: ServiceEntity
)