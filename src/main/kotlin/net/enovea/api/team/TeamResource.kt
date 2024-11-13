package net.enovea.api.team

import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import net.enovea.dto.TeamSummaryDTO
import net.enovea.service.TeamService

@Path("/api/teams")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class TeamResource(private val teamService: TeamService) {

//    @GET
//    @Path("/agencies")
//    fun getAgencies(): Response {
//        val agencies = teamService.getAgencies()
//        return Response.ok(agencies).build()
//    }

    @GET
    fun getAgencies(): List<String> {
        return teamService.getAllAgencies()
    }
}
