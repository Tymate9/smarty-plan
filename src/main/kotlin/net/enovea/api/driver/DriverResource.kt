package net.enovea.api.driver


import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import net.enovea.dto.DriverDTO
import net.enovea.service.DriverService

@Path("/api/drivers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class DriverResource(private val driverService: DriverService) {

    @GET
    fun getDrivers(@QueryParam("agencyIds") agencyIds: List<String>? =null): List<DriverDTO> {
        return driverService.getDrivers(agencyIds)
    }
}
