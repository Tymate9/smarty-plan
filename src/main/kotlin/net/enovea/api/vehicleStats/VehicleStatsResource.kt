package net.enovea.api.vehicleStats

import io.quarkus.security.Authenticated
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.api.trip.TripService
import net.enovea.service.TeamHierarchyNode
import net.enovea.service.VehicleService
import kotlin.reflect.jvm.internal.impl.name.StandardClassIds

@Path("/api/vehicles/vehicleStats")
//@Authenticated
class VehicleStatsResource (
    private val vehicleService: VehicleService
){
    @GET
    @Produces(MediaType.APPLICATION_JSON)
//    fun getVehicleStats(
//        @QueryParam("startDate") startDate: String,
//        @QueryParam("endDate") endDate: String
//    ): List<TeamHierarchyNode>? {
//        return vehicleService.getVehiclesStats(startDate, endDate)
//    }
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

//    fun getVehicleStats(
//        @QueryParam("startDate") startDate: String,
//        @QueryParam("endDate") endDate: String,
//        @QueryParam("agencyIds") agencyIds: List<String>?,
//        @QueryParam("vehiclesIds") vehiclesIds: List<String>?,
//        @QueryParam("driversIds") driversIds: List<String>?,
//    ): Response {
//        val result = vehicleService.getVehiclesStats(startDate, endDate , agencyIds, vehiclesIds , driversIds)
//        return if (result != null) {
//            val (teamHierarchyNodes, statsMap) = result
//            Response.ok(
//                mapOf(
//                    "teamHierarchyNodes" to teamHierarchyNodes,
//                    "stats" to statsMap
//                )
//            ).build()
//        } else {
//            Response.status(Response.Status.NOT_FOUND)
//                .entity("No vehicle stats found for the given date range")
//                .build()
//        }
//    }

}