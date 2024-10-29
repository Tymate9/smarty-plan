package net.enovea.domain.device


import net.enovea.dto.DeviceDTOsummary
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.factory.Mappers

@Mapper
interface DeviceSummaryMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "lastCommunicationDate", source = "lastCommunicationDate")
    @Mapping(target = "active", source = "active")
    @Mapping(target = "lastCommunicationLatitude", source = "lastCommunicationLatitude")
    @Mapping(target = "lastCommunicationLongitude", source = "lastCommunicationLongitude")
    fun toDeviceDTOsummary(deviceEntity: DeviceEntity): DeviceDTOsummary

    companion object {
        val INSTANCE: DeviceSummaryMapper = Mappers.getMapper(DeviceSummaryMapper::class.java)
    }

}
