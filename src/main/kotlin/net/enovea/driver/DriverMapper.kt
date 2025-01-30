package net.enovea.driver

import net.enovea.driver.driverTeam.DriverTeamEntity
import net.enovea.team.TeamSummaryMapper
import net.enovea.team.TeamSummaryDTO
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
    fun mapMostRecentTeam(driverTeams: List<DriverTeamEntity>): TeamSummaryDTO? {
        return driverTeams
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { TeamSummaryMapper.INSTANCE.toDto(it.team!!) }
    }

    companion object {
        val INSTANCE: DriverMapper = Mappers.getMapper(DriverMapper::class.java)
    }
}
