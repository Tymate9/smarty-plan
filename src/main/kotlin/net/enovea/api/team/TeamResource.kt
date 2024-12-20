package net.enovea.api.team

import io.quarkus.security.Authenticated
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import net.enovea.dto.TeamDTO
import net.enovea.service.TeamService

@Path("/api/teams")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
class TeamResource(private val teamService: TeamService) {

    @GET
    fun getAgencies(): List<TeamDTO> {
        return teamService.getAllAgencies()
    }
}
