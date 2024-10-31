package net.enovea.domain.device

import net.enovea.dto.DeviceDTO
import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers

@Mapper
interface DeviceMapper {
    // Map from DeviceEntity to DeviceDTO
    fun toDto(device: DeviceEntity): DeviceDTO

    // Map from DeviceDTO to DeviceEntity
    fun toEntity(deviceDTO: DeviceDTO): DeviceEntity


    companion object {
        val INSTANCE: DeviceMapper = Mappers.getMapper(DeviceMapper::class.java)
    }
}