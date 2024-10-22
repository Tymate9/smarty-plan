package net.enovea.domain.vehicle

import net.enovea.domain.driver.DriverMapper
import net.enovea.dto.DriverDTO
import net.enovea.dto.VehicleDTO
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.factory.Mappers
import java.sql.Timestamp

@Mapper(uses = [DriverMapper::class])
interface VehicleMapper {
    @Mapping(target = "drivers", source = "vehicleDrivers") // Map the drivers
    fun toVehicleDTO(vehicle : VehicleEntity) : VehicleDTO


//    @Mapping(target = "vehicleDrivers", source = "drivers" , qualifiedByName = ["mapDTOtoDrivers"])
//    @Mapping(target = "vehicleServices", ignore = true)
//    fun toVehicle(vehicle : VehicleDTO) : VehicleEntity

    fun map(vehicleDrivers: List<VehicleDriverEntity>): Map<ClosedRange<Timestamp>, DriverDTO> {
        return vehicleDrivers.associate {
            Pair(it.id.date..it.id.date, DriverMapper.INSTANCE.toDto(it.driver!!))
        }
    }

    companion object {
        val INSTANCE: VehicleMapper = Mappers.getMapper(VehicleMapper::class.java)
    }
}

