package net.enovea.conf

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.domain.team.TeamMapper
import net.enovea.service.TeamService


@ApplicationScoped
class TeamServiceConfiguration {

    @Produces
    @Named("teamService")
    fun teamService(
        teamMapper: TeamMapper
    ): TeamService {
        return TeamService(teamMapper)
    }
}