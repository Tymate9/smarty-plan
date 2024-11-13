package net.enovea.api.team

import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import net.enovea.service.TeamService

@Path("/api/teams")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class TeamResource(private val teamService: TeamService) {

    @GET
    fun getAgencies(): List<String> {
        return teamService.getAllAgencies()
    }
}
