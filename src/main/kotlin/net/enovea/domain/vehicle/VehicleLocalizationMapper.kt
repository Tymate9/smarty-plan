package net.enovea.domain.vehicle

import net.enovea.domain.device.DeviceEntity
import net.enovea.domain.device.DeviceSummaryMapper
import net.enovea.dto.VehicleLocalizationDTO
import org.locationtech.jts.geom.Point
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers

@Mapper
interface VehicleLocalizationMapper {

    @Mapping(target = "lastPosition", source = "vehicleDevices", qualifiedByName = ["lastPositionMapper"])
    fun toVehicleLocalizationDTO(vehicleEntity: VehicleEntity): VehicleLocalizationDTO

    @Named("lastPositionMapper")
    fun lastPositionMapper(vehicleDevices: List<DeviceVehicleInstallEntity>): Point? = vehicleDevices
        .filter { it.endDate == null }
        .maxByOrNull { it.id.startDate }
        ?.let { it.device?.deviceDataState?.lastPosition }

    companion object {
        val INSTANCE: VehicleLocalizationMapper = Mappers.getMapper(VehicleLocalizationMapper::class.java)
    }

}