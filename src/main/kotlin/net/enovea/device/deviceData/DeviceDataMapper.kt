package net.enovea.device.deviceData

import jakarta.enterprise.inject.spi.CDI
import net.enovea.device.DeviceEntity
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers

@Mapper(componentModel = "cdi")
interface DeviceDataMapper {

    @Mapping(source = "deviceDataState", target = "deviceDataState", qualifiedByName = ["deviceDataStateMapper"])
    fun toDto(deviceData: DeviceEntity): DeviceDataDTO

    fun toEntity(deviceDataDTO: DeviceDataDTO): DeviceEntity

    //TODO(Injecter le mapper au lieux d'utiliser CDI)
    @Named("deviceDataStateMapper")
    fun toDeviceDataDTO(deviceDataState: DeviceDataStateEntity?): DeviceDataStateDTO? = deviceDataState?.let { CDI.current().select(DeviceDataStateMapper::class.java).get().toDto(deviceDataState) }
}