package net.enovea.domain.device


import net.enovea.dto.DeviceSummaryDTO
import org.locationtech.jts.geom.Point
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers

@Mapper
interface DeviceSummaryMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "lastCommunicationDate", source = "lastCommunicationDate")
    @Mapping(target = "enabled", source = "enabled")
    @Mapping(target = "coordinate", source = "deviceDataState", qualifiedByName = ["coordinateMapper"])
    @Mapping(target="state", source = "deviceDataState", qualifiedByName = ["stateMapper"])
    fun toDeviceDTOsummary(deviceEntity: DeviceEntity): DeviceSummaryDTO

    @Named("coordinateMapper")
    fun coordinateMapper(deviceDataState: DeviceDataStateEntity): Point? = deviceDataState.coordinate

    @Named("stateMapper")
    fun stateMapper(deviceDataState: DeviceDataStateEntity): String? = deviceDataState.state

    companion object {
        val INSTANCE: DeviceSummaryMapper = Mappers.getMapper(DeviceSummaryMapper::class.java)
    }

}
