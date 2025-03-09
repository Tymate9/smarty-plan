package net.enovea.domain.driver

import jakarta.inject.Inject
import net.enovea.domain.team.TeamSummaryMapper
import net.enovea.dto.DriverDTO
import net.enovea.dto.TeamSummaryDTO
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.factory.Mappers

@Mapper(componentModel = "cdi")
abstract class DriverMapper {

    @Inject
    protected lateinit var teamSummaryMapper: TeamSummaryMapper

    // Map from DriverEntity to DriverDTO
    @Mapping(source ="driverTeams",target = "team")
    abstract fun toDto(driver: DriverEntity): DriverDTO

    // Map from DriverDTO to DriverEntity
    abstract fun toEntity(driverDTO: DriverDTO): DriverEntity

    //Map the most recent team to TeamDTO
    fun mapMostRecentTeam(driverTeams: List<DriverTeamEntity>): TeamSummaryDTO? {
        return driverTeams
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { teamSummaryMapper.toDto(it.team!!) }
    }
}
