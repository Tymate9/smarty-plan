package net.enovea

import jakarta.inject.Inject
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.dto.VehicleDTOsummary
import net.enovea.service.VehicleService

@Path("/vehicles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class VehicleResource @Inject constructor(private val vehicleService: VehicleService) {

    @GET
    fun getAllVehiclesDetails(): List<VehicleDTOsummary> {
        return vehicleService.getVehiclesSummary()
    }

    @GET
    @Path("/filtered")
    fun getFilteredVehicles(
        @QueryParam("teamLabels") teamLabels: List<String>?,
        @QueryParam("vehicleIds") vehicleIds: List<String>?,
        @QueryParam("driverNames") driverNames: List<String>?
    ): Response {
        val filteredVehicles = vehicleService.getFilteredVehicles(teamLabels, vehicleIds, driverNames)
        val vehicleSummaries = vehicleService.getVehiclesSummary(filteredVehicles)
        return Response.ok(vehicleSummaries).build()
    }


    //GET /vehicles/filtered?teamLabels=team1,team2&vehicleIds=MM,NN&driverNames=John Doe,Jane Doe

}