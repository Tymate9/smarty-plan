package net.enovea.team

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import jakarta.validation.Validation
import jakarta.validation.Validator
import net.enovea.team.teamCategory.TeamCategoryMapper


@ApplicationScoped
class TeamServiceConfiguration {

    @Produces
    @Named("teamService")
    fun teamService(
        teamMapper: TeamMapper,
        teamCategoryMapper : TeamCategoryMapper
    ): TeamService {
        return TeamService(teamMapper, teamCategoryMapper)
    }

    @Produces
    @ApplicationScoped
    fun teamMapper(): TeamMapper = TeamMapper.INSTANCE

    @Produces
    @ApplicationScoped
    fun teamCategoryMapper(): TeamCategoryMapper = TeamCategoryMapper.INSTANCE

    @Produces
    @Named("validator")
    @ApplicationScoped
    fun validator(): Validator = Validation.buildDefaultValidatorFactory().validator

}