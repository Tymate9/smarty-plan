package net.enovea.device

import jakarta.enterprise.inject.spi.CDI
import net.enovea.device.deviceData.DeviceDataStateMapper
import net.enovea.device.deviceData.DeviceDataStateEntity
import net.enovea.device.deviceData.DeviceDataStateDTO
import net.enovea.device.deviceData.until
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
    @Mapping(target = "plugged", source = "deviceDataState", qualifiedByName = ["pluggedMapper"])
    fun toDeviceDTOsummary(deviceEntity: DeviceEntity): DeviceSummaryDTO

    /**
     * Récupère la propriété 'plugged' depuis le DTO, qui lui-même peut être anonymisé
     * (si un jour la logique le nécessitait).
     */
    @Named("pluggedMapper")
    fun pluggedMapper(deviceDataState: DeviceDataStateEntity?): Boolean? {
        val dto = mapDeviceDataStateToDto(deviceDataState) ?: return null
        return dto.plugged
    }

    /**
     * Récupère 'lastCommTime' directement ou depuis le DTO (ici, anonymisation non nécessaire).
     */
    @Named("lastCommunicationDateMapper")
    fun lastCommunicationDateMapper(deviceDataState: DeviceDataStateEntity?): Timestamp? {
        val dto = mapDeviceDataStateToDto(deviceDataState) ?: return null
        return dto.lastCommTime
    }

    /**
     * Récupère 'coordinate' via DeviceDataStateDTO, déjà anonymisé si la pause est en cours.
     */
    @Named("coordinateMapper")
    fun coordinateMapper(deviceDataState: DeviceDataStateEntity?): Point? {
        val dto = mapDeviceDataStateToDto(deviceDataState) ?: return null
        return dto.coordinate
    }

    /**
     * Récupère 'state' via DeviceDataStateDTO,
     * où 'NO_COM' ou autre traitement (BR_StateMapper) est déjà appliqué.
     */
    @Named("stateMapper")
    fun stateMapper(deviceDataState: DeviceDataStateEntity?): String? {
        val dto = mapDeviceDataStateToDto(deviceDataState) ?: return null
        return dto.state
    }

    private fun mapDeviceDataStateToDto(entity: DeviceDataStateEntity?): DeviceDataStateDTO? {
        if (entity == null) return null
        return CDI.current().select(DeviceDataStateMapper::class.java).get().toDto(entity)
    }

    companion object {
        val INSTANCE: DeviceSummaryMapper = Mappers.getMapper(DeviceSummaryMapper::class.java)
    }
}
