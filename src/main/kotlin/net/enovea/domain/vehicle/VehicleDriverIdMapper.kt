package net.enovea.domain.vehicle

import net.enovea.dto.VehicleDriverIdDTO
import org.mapstruct.factory.Mappers

interface VehicleDriverIdMapper {
    companion object {
        val INSTANCE: VehicleDriverIdMapper = Mappers.getMapper(VehicleDriverIdMapper::class.java)
    }

    fun toVehicleDriverIdDTO(id: VehicleDriverId): VehicleDriverIdDTO
    fun toVehicleDriverIdEntity(dto: VehicleDriverIdDTO): VehicleDriverId
}