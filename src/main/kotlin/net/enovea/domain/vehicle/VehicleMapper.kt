package net.enovea.domain.vehicle

import net.enovea.domain.device.DeviceMapper
import net.enovea.domain.driver.DriverMapper
import net.enovea.domain.team.TeamMapper
import net.enovea.dto.DeviceDTO
import net.enovea.dto.DriverDTO
import net.enovea.dto.TeamDTO
import net.enovea.dto.VehicleDTO
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.factory.Mappers
import java.sql.Timestamp

@Mapper(uses = [DriverMapper::class , DeviceMapper::class , TeamMapper::class])
interface VehicleMapper {

    @Mapping(source = "vehicleDrivers", target = "drivers")
    @Mapping(source = "vehicleDevices", target = "devices")
    @Mapping(source = "vehicleTeams", target = "teams")
    fun toVehicleDTO(vehicle: VehicleEntity): VehicleDTO


    // Map List<VehicleDriver> to List<DriverDTO>
    fun mapVehicleDriversToDriversDTO(vehicleDrivers: List<VehicleDriverEntity>): Map<ClosedRange<Timestamp>, DriverDTO> =
        vehicleDrivers.associate { Pair(it.id.date..it.id.date, DriverMapper.instance.toDto(it.driver!!)) }


    // Map List<VehicleDevices> to List<DeviceDTO>
    fun mapVehicleDevicesToDevicesDTO(vehicleDevices: List<VehicleDeviceEntity>):List<DeviceDTO> =
        vehicleDevices.map { DeviceMapper.instance.toDto(it.device!!) }


    // Map List<VehicleTeams> to List<TeamDTO>
    fun mapVehicleTeamsToTeamsDTO(vehicleTeams: List<VehicleTeamEntity>):List<TeamDTO> =
        vehicleTeams.map { TeamMapper.instance.toDto(it.team!!) }



    companion object {
        val instance = Mappers.getMapper(VehicleMapper::class.java)
    }
}

