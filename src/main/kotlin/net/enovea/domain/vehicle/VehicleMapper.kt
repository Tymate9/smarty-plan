package net.enovea.domain.vehicle

import net.enovea.domain.device.DeviceMapper
import net.enovea.domain.device.DeviceSummaryMapper
import net.enovea.domain.driver.DriverMapper
import net.enovea.domain.team.TeamMapper
import net.enovea.domain.team.TeamSummaryMapper
import net.enovea.domain.vehicle_category.VehicleCategoryMapper
import net.enovea.dto.*
import org.locationtech.jts.geom.Point
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers

@Mapper(uses = [DriverMapper::class , DeviceMapper::class , TeamMapper::class , VehicleCategoryMapper::class])
interface VehicleMapper {

    // Vehicle Summary Mapper
    @Mapping(source ="vehicleDrivers",target = "driver")
    @Mapping(source ="vehicleDevices",target = "device")
    @Mapping(source ="vehicleTeams",target = "team")
    fun toVehicleDTOSummary(vehicleEntity: VehicleEntity): VehicleSummaryDTO

    //Map VehicleDrivers to recent DriverDTO
    fun mapMostRecentDriver(vehicleDrivers: List<VehicleDriverEntity>): DriverDTO? {
        val driverEntity = VehicleEntity.getCurrentDriver(vehicleDrivers)
        return if (driverEntity == null) {
            null
        } else {
            DriverMapper.INSTANCE.toDto(driverEntity)
        }
    }

    //Map most recent Device to DeviceDTOsummary
    fun mapMostRecentDevice(vehicleDevices: List<DeviceVehicleInstallEntity>): DeviceSummaryDTO? {
        val deviceEntity = VehicleEntity.getCurrentDevice(vehicleDevices)
        return if (deviceEntity == null) {
            null
        } else {
            DeviceSummaryMapper.INSTANCE.toDeviceDTOsummary(deviceEntity)
        }
    }

    //Map the most recent team to TeamDTO
    fun mapMostRecentTeam(vehicleTeams: List<VehicleTeamEntity>): TeamSummaryDTO? {
        return vehicleTeams
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { TeamSummaryMapper.INSTANCE.toDto(it.team!!) }
    }

    // Vehicle Mapper
    @Mapping(source = "vehicleDrivers", target = "drivers")
    @Mapping(source = "vehicleDevices", target = "devices")
    @Mapping(source = "vehicleTeams", target = "teams")
    @Mapping(source = "category",target = "category")
    fun toVehicleDTO(vehicle: VehicleEntity): VehicleDTO

    //Map VehicleDriversEntity to DriverDTOs with start and end date
    fun mapVehicleDriversToDriversDTO(vehicleDrivers: List<VehicleDriverEntity>): Map<TimestampRange, DriverDTO> =
        vehicleDrivers.associate {
            val startDate = it.id.startDate
            val endDate = it.endDate
            TimestampRange(startDate, endDate) to DriverMapper.INSTANCE.toDto(it.driver!!)
        }

    //Map DeviceVehicleInstallEntity to DeviceDTOs with start and end date
    fun mapVehicleDevicesToDevicesDTO(vehicleDevices: List<DeviceVehicleInstallEntity>):Map<TimestampRange, DeviceDTO> =
        vehicleDevices.associate {
            val startDate = it.id.startDate
            val endDate = it.endDate
            TimestampRange(startDate, endDate) to DeviceMapper.INSTANCE.toDto(it.device!!)
        }


    //Map VehicleTeamEntity to TeamDTOs with start and end date
    fun mapVehicleTeamsToTeamsDTO(vehicleTeams: List<VehicleTeamEntity>):Map<TimestampRange, TeamDTO> =
        vehicleTeams.associate {
            val startDate = it.id.startDate
            val endDate = it.endDate
            TimestampRange(startDate, endDate) to TeamMapper.INSTANCE.toDto(it.team!!)
        }

    // Vehicle Localization
    @Mapping(target = "lastPosition", source = "vehicleDevices", qualifiedByName = ["localizationLastPositionMapper"])
    fun toVehicleLocalizationDTO(vehicle: VehicleEntity): VehicleLocalizationDTO

    @Named("localizationLastPositionMapper")
    fun localizationLastPositionMapper(vehicleDevices: List<DeviceVehicleInstallEntity>): Point? = vehicleDevices
        .filter { it.endDate == null }
        .maxByOrNull { it.id.startDate }
        ?.let { it.device?.deviceDataState?.coordinate }



    companion object {
        val INSTANCE: VehicleMapper = Mappers.getMapper(VehicleMapper::class.java)

    }
}

