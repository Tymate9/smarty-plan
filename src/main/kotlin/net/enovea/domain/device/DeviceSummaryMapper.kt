package net.enovea.domain.device


import net.enovea.dto.DeviceSummaryDTO
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.factory.Mappers

@Mapper
interface DeviceSummaryMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "lastCommunicationDate", source = "lastCommunicationDate")
    @Mapping(target = "enabled", source = "enabled")
    @Mapping(target = "coordinate", source = "coordinate")
    fun toDeviceDTOsummary(deviceEntity: DeviceEntity): DeviceSummaryDTO

    companion object {
        val INSTANCE: DeviceSummaryMapper = Mappers.getMapper(DeviceSummaryMapper::class.java)
    }

}
