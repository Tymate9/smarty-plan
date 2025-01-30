package net.enovea.driver


import io.quarkus.security.Authenticated
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType

@Path("/api/drivers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
class DriverResource(private val driverService: DriverService) {

    @GET
    fun getDrivers(@QueryParam("agencyIds") agencyIds: List<String>? =null): List<DriverDTO> {
        return driverService.getDrivers(agencyIds)
    }
}
