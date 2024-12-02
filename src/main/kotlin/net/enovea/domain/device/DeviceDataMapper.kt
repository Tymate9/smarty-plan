package net.enovea.domain.device

import net.enovea.dto.DeviceDataDTO
import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers

@Mapper
interface DeviceDataMapper {

    fun toDto(deviceData: DeviceEntity): DeviceDataDTO
    fun toEntity(deviceDataDTO: DeviceDataDTO): DeviceEntity

    companion object {
        val INSTANCE: DeviceDataMapper = Mappers.getMapper(DeviceDataMapper::class.java)
    }
}