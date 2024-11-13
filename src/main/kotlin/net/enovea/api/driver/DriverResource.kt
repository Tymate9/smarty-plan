package net.enovea.api.driver


import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import net.enovea.service.DriverService

@Path("/api/drivers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class DriverResource(private val driverService: DriverService) {

    @GET
    // @Path("/drivers")
    fun getDrivers(@QueryParam("agencyIds") agencyIds: List<String>? =null): List<String> {
        return driverService.getDrivers(agencyIds)
    }


//    @GET
//    fun getDrivers(): List<String> {
//        return driverService.getAllDrivers()
//    }
//    // New method to get drivers by a list of agency IDs
//    @GET
//    @Path("/byAgencies")
//    fun getDriversByAgencies(@QueryParam("agencyIds") agencyIds: List<String>): List<String> {
//        return driverService.getDriversByAgencies(agencyIds)
//    }


}
