package net.enovea.device.deviceData

import jakarta.enterprise.inject.spi.CDI
import net.enovea.device.DeviceEntity
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers

@Mapper
interface DeviceDataMapper {

    @Mapping(source = "deviceDataState", target = "deviceDataState", qualifiedByName = ["deviceDataStateMapper"])
    fun toDto(deviceData: DeviceEntity): DeviceDataDTO

    fun toEntity(deviceDataDTO: DeviceDataDTO): DeviceEntity

    @Named("deviceDataStateMapper")
    fun toDeviceDataDTO(deviceDataState: DeviceDataStateEntity?): DeviceDataStateDTO? = deviceDataState?.let { CDI.current().select(DeviceDataStateMapper::class.java).get().toDto(deviceDataState) }

    companion object {
        val INSTANCE: DeviceDataMapper = Mappers.getMapper(DeviceDataMapper::class.java)
    }

}

