package net.enovea.driver

import io.quarkus.security.Authenticated
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.api.workInProgress.DriverForm
import net.enovea.team.TeamService

@Path("/api/drivers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class DriverResource(
    private val driverService: DriverService,
    private val teamService: TeamService) {

    @GET
    fun getDrivers(@QueryParam("agencyIds") agencyIds: List<String>? =null): List<DriverDTO> {
        return driverService.getDrivers(agencyIds)
    }

    @GET
    @Path("/authorized-data")
    fun getAuthorizedData() : Response {
        val list = teamService.getDriverTreeAtDate()
        return Response.ok(list).build()
    }

    @GET
    @Path("/count")
    fun getCount() : Response {
        return Response.ok(DriverEntity.count()).build()
    }

    @GET
    @Path("/stats")
    fun getStats() : Response {
        return Response.ok(driverService.getDriverStats()).build()
    }

    @GET
    @Path("/{id}")
    fun getDriverById(@PathParam("id") id: Int): DriverDTO {
        return driverService.getDriverById(id)
    }

    @POST
    fun createDriver(form: DriverForm): DriverDTO {
        return driverService.createDriver(form)
    }

    @PUT
    @Path("/{id}")
    fun updateDriver(@PathParam("id") id: Int, form: DriverForm): DriverDTO {
        return driverService.updateDriver(id, form)
    }

    @DELETE
    @Path("/{id}")
    fun deleteDriver(@PathParam("id") id: Int): Response {
        driverService.deleteDriver(id)
        return Response.noContent().build()
    }
}
