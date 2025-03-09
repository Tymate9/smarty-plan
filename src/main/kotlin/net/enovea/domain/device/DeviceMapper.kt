package net.enovea.domain.device

import net.enovea.domain.driver.DriverMapper
import net.enovea.domain.team.TeamMapper
import net.enovea.domain.vehicle.VehicleMapper
import net.enovea.dto.DeviceDTO
import net.enovea.dto.DeviceDataStateDTO
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers

@Mapper( componentModel = "cdi", uses = [DeviceDataStateMapper::class  ])
interface DeviceMapper {

    // Map from DeviceEntity to DeviceDTO
    fun toDto(device: DeviceEntity): DeviceDTO

    // Map from DeviceDTO to DeviceEntity
    fun toEntity(deviceDTO: DeviceDTO): DeviceEntity
}