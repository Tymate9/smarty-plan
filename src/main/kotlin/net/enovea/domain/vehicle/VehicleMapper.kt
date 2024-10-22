package net.enovea.domain.vehicle

import net.enovea.domain.driver.DriverMapper
import net.enovea.dto.DeviceDTO
import net.enovea.dto.DriverDTO
import net.enovea.dto.VehicleDTO
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.factory.Mappers
import java.sql.Timestamp

@Mapper(uses = [DriverMapper::class])
interface VehicleMapper {

    @Mapping(source = "vehicleDrivers", target = "drivers")
    @Mapping(source = "vehicleDevices", target = "devices")
    fun toVehicleDTO(vehicle: VehicleEntity): VehicleDTO

    // Map List<VehicleDriver> to List<DriverDTO>
    @Mapping(source = "driver", target = ".")
    fun vehicleDriverToDriverDTO(vehicleDriver: VehicleDriverEntity): DriverDTO

    // Custom method to map the vehicleDrivers from Vehicle to DriverDTOs
    fun mapVehicleDriversToDrivers(vehicleDrivers: List<VehicleDriverEntity>): Map<ClosedRange<Timestamp>, DriverDTO> =
        vehicleDrivers.associate { Pair(it.id.date..it.id.date, vehicleDriverToDriverDTO(it)) }


    // Map List<VehicleDevices> to List<DeviceDTO>
    @Mapping(source = "device", target = ".")
    fun vehicleDeviceToDeviceDTO(vehicleDevice: VehicleDeviceEntity): DeviceDTO

    fun mapVehicleDevicesToDevices(vehicleDevices: List<VehicleDeviceEntity>):List<DeviceDTO> {
        return vehicleDevices.map { vehicleDeviceToDeviceDTO(it) }
    }


    companion object {
        val instance = Mappers.getMapper(VehicleMapper::class.java)
    }
}

