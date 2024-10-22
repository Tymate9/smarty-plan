package net.enovea.domain.vehicle

import net.enovea.dto.VehicleDriverDTO
import org.mapstruct.Mapping
import org.mapstruct.factory.Mappers

interface VehicleDriverMapper {
    companion object {
        val INSTANCE: VehicleDriverMapper = Mappers.getMapper(VehicleDriverMapper::class.java)
    }

    @Mapping(target = "id", source = "id")
    @Mapping(target = "vehicle", source = "vehicle")
    @Mapping(target = "driver", source = "driver")
    fun toVehicleDriverDTO(vehicleDriverEntity: VehicleDriverEntity): VehicleDriverDTO

    @Mapping(target = "vehicle", source = "vehicle")
    @Mapping(target = "driver", source = "driver")
    fun toVehicleDriverEntity(vehicleDriverDTO: VehicleDriverDTO): VehicleDriverEntity
}