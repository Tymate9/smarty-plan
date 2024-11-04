package net.enovea.domain.driver

import net.enovea.domain.team.TeamSummaryMapper
import net.enovea.domain.vehicle.VehicleTeamEntity
import net.enovea.dto.DriverDTO
import net.enovea.dto.TeamDTOsummary
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.factory.Mappers

@Mapper
interface DriverMapper {
    // Map from DriverEntity to DriverDTO
    @Mapping(source ="driverTeams",target = "team")
    fun toDto(driver: DriverEntity): DriverDTO

    // Map from DriverDTO to DriverEntity
    fun toEntity(driverDTO: DriverDTO): DriverEntity

    //Map the most recent team to TeamDTO
    fun mapMostRecentTeam(driverTeams: List<DriverTeamEntity>): TeamDTOsummary? {
        return driverTeams
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { TeamSummaryMapper.INSTANCE.toDto(it.team!!) }
    }

    companion object {
        val INSTANCE: DriverMapper = Mappers.getMapper(DriverMapper::class.java)
    }
}
