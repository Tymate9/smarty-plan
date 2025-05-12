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
        @QueryParam("driversIds") driversIds: List<String>?,
        @QueryParam("vehiclesType") vehiclesType: String,
    ): Response {
        val result = vehicleService.getVehiclesStatsOverPeriod(startDate, endDate ,teamLabels,vehicleIds, driversIds , vehiclesType)
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
        @QueryParam("vehiclesType") vehiclesType: String,
    ): List<VehicleStatsQueryResult> {
        return vehicleService.getVehicleStatsDaily(startDate,endDate,vehicleId,vehiclesType)
    }

    @GET
    @Path("/report-qse")
    @Produces(MediaType.APPLICATION_JSON)

    fun getVehicleStatsQse(
        @QueryParam("startDate") startDate: String,
        @QueryParam("endDate") endDate: String,
        @QueryParam("teamLabels") teamLabels: List<String>?,
        @QueryParam("vehicleIds") vehicleIds: List<String>?,
        @QueryParam("driversIds") driversIds: List<String>?,
        @QueryParam("vehiclesType") vehiclesType: String
    ): Response {
        val result = vehicleService.getVehiclesStatsQSEReport(startDate, endDate ,teamLabels,vehicleIds, driversIds, vehiclesType)
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