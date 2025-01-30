package net.enovea.vehicle.vehicleStats

import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.vehicle.VehicleService

@Path("/api/vehicles/vehicleStats")
//@Authenticated
class VehicleStatsResource (
    private val vehicleService: VehicleService
){
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    fun getVehicleStats(
        @QueryParam("startDate") startDate: String,
        @QueryParam("endDate") endDate: String,
        @QueryParam("teamLabels") teamLabels: List<String>?,
        @QueryParam("vehicleIds") vehicleIds: List<String>?,
        @QueryParam("driversIds") driversIds: List<String>?
    ): Response {
        val result = vehicleService.getVehiclesStats(startDate, endDate ,teamLabels,vehicleIds, driversIds)
        return if (result != null) {
            val (teamHierarchyNodes, statsMap) = result
            Response.ok(
                mapOf(
                    "teamHierarchyNodes" to teamHierarchyNodes,
                    "stats" to statsMap
                )
            ).build()
        } else {
            Response.status(Response.Status.NOT_FOUND)
                .entity("No vehicle stats found for the given date range")
                .build()
        }
    }

}