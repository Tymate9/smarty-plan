package net.enovea.domain.vehicle
import net.enovea.domain.device.DeviceSummaryMapper
import net.enovea.domain.driver.DriverMapper
import net.enovea.domain.team.TeamSummaryMapper
import net.enovea.dto.*
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.factory.Mappers

@Mapper(uses = [DriverMapper::class , DeviceSummaryMapper::class , TeamSummaryMapper::class , VehicleSummaryMapper::class  ])
interface VehicleSummaryMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "licenseplate", source = "licenseplate")
    @Mapping(source = "category",target = "category")
    @Mapping(source ="vehicleDrivers",target = "driver")
    @Mapping(source ="vehicleDevices",target = "device")
    @Mapping(source ="vehicleTeams",target = "team")
    fun toVehicleDTOsummary(vehicleEntity: VehicleEntity): VehicleSummaryDTO

    //Map VehicleDrivers to recent DriverDTO
    fun mapMostRecentDriver(vehicleDrivers: List<VehicleDriverEntity>): DriverDTO? {
        return vehicleDrivers
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { DriverMapper.INSTANCE.toDto(it.driver!!) }
    }

    //Map most recent Device to DeviceDTOsummary
    fun mapMostRecentDevice(vehicleDevices: List<DeviceVehicleInstallEntity>): DeviceSummaryDTO? {
        return vehicleDevices
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { DeviceSummaryMapper.INSTANCE.toDeviceDTOsummary(it.device!!) }
    }

    //Map the most recent team to TeamDTO
    fun mapMostRecentTeam(vehicleTeams: List<VehicleTeamEntity>): TeamSummaryDTO? {
        return vehicleTeams
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { TeamSummaryMapper.INSTANCE.toDto(it.team!!) }
    }

    companion object {
        val INSTANCE: VehicleSummaryMapper = Mappers.getMapper(VehicleSummaryMapper::class.java)
    }
}
