package net.enovea.device

import jakarta.inject.Inject
import net.enovea.device.deviceData.DeviceDataStateDTO
import net.enovea.device.deviceData.DeviceDataStateEntity
import net.enovea.device.deviceData.DeviceDataStateMapper
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers

@Mapper( componentModel = "cdi")
abstract class DeviceMapper {

    @Inject
    private lateinit var deviceDataStateMapper: DeviceDataStateMapper
    // Map from DeviceEntity to DeviceDTO
    @Mapping(source = "deviceDataState", target = "deviceDataState", qualifiedByName = ["deviceDataStateMapper"])
    abstract  fun toDto(device: DeviceEntity): DeviceDTO

    @Named("deviceDataStateMapper")
    fun toDeviceDataDTO(deviceDataState: DeviceDataStateEntity?): DeviceDataStateDTO? = deviceDataState?.let { deviceDataStateMapper.toDto(deviceDataState) }

    // Map from DeviceDTO to DeviceEntity
    abstract fun toEntity(deviceDTO: DeviceDTO): DeviceEntity
}