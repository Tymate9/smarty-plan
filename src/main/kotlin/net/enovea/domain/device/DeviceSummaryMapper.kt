package net.enovea.domain.device


import net.enovea.dto.DeviceSummaryDTO
import org.locationtech.jts.geom.Point
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers
import java.sql.Timestamp
import java.time.Instant

@Mapper
interface DeviceSummaryMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "lastCommunicationDate", source = "deviceDataState", qualifiedByName = ["lastCommunicationDateMapper"])
    @Mapping(target = "enabled", source = "enabled")
    @Mapping(target = "coordinate", source = "deviceDataState", qualifiedByName = ["coordinateMapper"])
    @Mapping(target="state", source = "deviceDataState", qualifiedByName = ["stateMapper"])
    fun toDeviceDTOsummary(deviceEntity: DeviceEntity): DeviceSummaryDTO

    @Named("lastCommunicationDateMapper")
    fun lastCommunicationDateMapper(deviceDataState: DeviceDataStateEntity?): Timestamp?{
        return if(deviceDataState != null){
            deviceDataState.lastCommTime
        } else {
            null
        }
    }

    @Named("coordinateMapper")
    fun coordinateMapper(deviceDataState: DeviceDataStateEntity?): Point?{
        return if(deviceDataState != null){
            deviceDataState.coordinate
        } else {
            null
        }
    }

    @Named("stateMapper")
    fun stateMapper(deviceDataState: DeviceDataStateEntity?): String?{
        return if(deviceDataState?.lastCommTime?.toInstant().until(Instant.now()).toHours() >= 12) {
            "NO_COM"
        }else {
            deviceDataState?.state
        }
    }

    companion object {
        val INSTANCE: DeviceSummaryMapper = Mappers.getMapper(DeviceSummaryMapper::class.java)
    }

}
