package net.enovea.domain.device

import jakarta.enterprise.inject.spi.CDI
import net.enovea.dto.DeviceDataDTO
import net.enovea.dto.DeviceDataStateDTO
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers

@Mapper(componentModel = "cdi")
interface DeviceDataMapper {

    @Mapping(source = "deviceDataState", target = "deviceDataState", qualifiedByName = ["deviceDataStateMapper"])
    fun toDto(deviceData: DeviceEntity): DeviceDataDTO

    fun toEntity(deviceDataDTO: DeviceDataDTO): DeviceEntity

    @Named("deviceDataStateMapper")
    fun toDeviceDataDTO(deviceDataState: DeviceDataStateEntity?): DeviceDataStateDTO? = deviceDataState?.let { CDI.current().select(DeviceDataStateMapper::class.java).get().toDto(deviceDataState) }
}

