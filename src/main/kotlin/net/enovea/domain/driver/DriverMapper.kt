package net.enovea.domain.driver

import net.enovea.dto.DriverDTO
import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers

@Mapper
interface DriverMapper {
    // Map from DriverEntity to DriverDTO
    fun toDto(driver: DriverEntity): DriverDTO

    // Map from DriverDTO to DriverEntity
    fun toEntity(driverDTO: DriverDTO): DriverEntity

    // Create an instance of the mapper
    companion object {
        val instance = Mappers.getMapper(DriverMapper::class.java)
    }
}
