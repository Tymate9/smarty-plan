package net.enovea.conf

import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import net.enovea.service.TeamService


@ApplicationScoped
class TeamServiceConfiguration {

    @Produces
    @Named("teamService")
    fun teamService(): TeamService {
        return TeamService()
    }

}