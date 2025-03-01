package net.enovea.device

import net.enovea.device.deviceData.DeviceDataStateDTO
import net.enovea.device.deviceData.DeviceDataStateEntity
import net.enovea.device.deviceData.DeviceDataStateMapper
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers

@Mapper( componentModel = "cdi")
interface DeviceMapper {

    // Map from DeviceEntity to DeviceDTO
    @Mapping(source = "deviceDataState", target = "deviceDataState", qualifiedByName = ["deviceDataStateMapper"])
    fun toDto(device: DeviceEntity): DeviceDTO

    @Named("deviceDataStateMapper")
    fun toDeviceDataDTO(deviceDataState: DeviceDataStateEntity?): DeviceDataStateDTO? = deviceDataState?.let { DeviceDataStateMapper.INSTANCE.toDto(deviceDataState) }

    // Map from DeviceDTO to DeviceEntity
    fun toEntity(deviceDTO: DeviceDTO): DeviceEntity
}