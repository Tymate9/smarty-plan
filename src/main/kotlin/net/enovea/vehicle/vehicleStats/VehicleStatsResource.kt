package net.enovea.vehicle.vehicleStats

import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.vehicle.TeamHierarchyNode
import net.enovea.vehicle.VehicleService
import net.enovea.vehicle.VehicleSummaryDTO

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
        val result = vehicleService.getVehiclesStatsOverPeriod(startDate, endDate ,teamLabels,vehicleIds, driversIds)
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

    @GET
    @Path("/daily")
    @Produces(MediaType.APPLICATION_JSON)

    fun getVehicleDailyStats(
        @QueryParam("startDate") startDate: String,
        @QueryParam("endDate") endDate: String,
        @QueryParam("vehicleId") vehicleId: String,
    ): List<VehicleStatsDTO> {
        return vehicleService.getVehicleStatsDaily(startDate,endDate,vehicleId)
    }

    @GET
    @Path("/report-qse")
    @Produces(MediaType.APPLICATION_JSON)

//    fun getVehicleStatsQse(
//        @QueryParam("startDate") startDate: String,
//        @QueryParam("endDate") endDate: String,
//        @QueryParam("teamLabels") teamLabels: List<String>?,
//        @QueryParam("vehicleIds") vehicleIds: List<String>?,
//        @QueryParam("driversIds") driversIds: List<String>?
//    ): List<TeamHierarchyNode> {
//        return vehicleService.getVehiclesStatsQSEReport(startDate, endDate ,teamLabels,vehicleIds, driversIds)
//    }

    fun getVehicleStatsQse(
        @QueryParam("startDate") startDate: String,
        @QueryParam("endDate") endDate: String,
        @QueryParam("teamLabels") teamLabels: List<String>?,
        @QueryParam("vehicleIds") vehicleIds: List<String>?,
        @QueryParam("driversIds") driversIds: List<String>?
    ): Response {
        val result = vehicleService.getVehiclesStatsQSEReport(startDate, endDate ,teamLabels,vehicleIds, driversIds)
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