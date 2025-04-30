package net.enovea.acceleration

import jakarta.inject.Inject
import net.enovea.device.DeviceDTO
import net.enovea.device.DeviceEntity
import org.mapstruct.Mapper
import org.mapstruct.Mapping

@Mapper( componentModel = "cdi")
abstract class DeviceAccelAnglesMapper {

    @Mapping(source = "id.deviceId", target = "deviceId")
    @Mapping(source = "id.beginDate", target = "beginDate")
    abstract fun toDto(entity: DeviceAccelAnglesEntity): DeviceAccelAnglesDTO
}