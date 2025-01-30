package net.enovea.vehicle.vehicleTable

import net.enovea.device.deviceData.DeviceDataDTO
import net.enovea.device.deviceData.DeviceDataMapper
import net.enovea.device.deviceData.DeviceDataStateMapper
import net.enovea.device.DeviceMapper
import net.enovea.driver.DriverMapper
import net.enovea.team.TeamMapper
import net.enovea.team.TeamDTO
import net.enovea.device.deviceVehicle.DeviceVehicleInstallEntity
import net.enovea.vehicle.VehicleEntity
import net.enovea.vehicle.VehicleMapper
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import org.mapstruct.Context
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.factory.Mappers

@Mapper( componentModel = "cdi", uses = [DriverMapper::class , DeviceMapper::class , TeamMapper::class , VehicleMapper::class, DeviceDataStateMapper::class  ])
interface VehicleTableMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "licenseplate", source = "licenseplate")
    @Mapping(source = "category",target = "category")
    @Mapping(target = "driver", expression = "java(vehicleMapper.mapMostRecentDriver(vehicleEntity.retrieveVehicleDrivers()))")
    @Mapping(source ="vehicleDevices",target = "device")
    @Mapping(source ="vehicleTeams",target = "team")
    fun toVehicleTableDTO(vehicleEntity: VehicleEntity,
                          @Context vehicleMapper: VehicleMapper
    ): VehicleTableDTO

    //Map most recent Device to DeviceDataDTO
    fun mapRecentDevice(vehicleDevices: List<DeviceVehicleInstallEntity>): DeviceDataDTO? {
        return vehicleDevices
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { DeviceDataMapper.INSTANCE.toDto(it.device!!) }
    }

    //Map the most recent team to TeamDTO
    fun mapRecentTeam(vehicleTeams: List<VehicleTeamEntity>): TeamDTO? {
        return vehicleTeams
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { TeamMapper.INSTANCE.toDto(it.team!!) }
    }

    companion object {
        val INSTANCE: VehicleTableMapper = Mappers.getMapper(VehicleTableMapper::class.java)
    }
}
