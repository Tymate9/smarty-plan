package net.enovea

import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.dto.VehicleDTO
import net.enovea.dto.VehicleDriverDTO
import net.enovea.service.VehicleService



@Path("/vehicles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class VehicleResource(private val vehicleService: VehicleService) {

    @GET
    fun getAllVehicles(): List<VehicleDTO> {
        return vehicleService.getAllVehicles()
    }

//    @GET
//    @Path("/{id}")
//    fun getVehicleById(@PathParam("id") id: String): VehicleDTO? {
//        return vehicleService.getVehicleById(id)
//    }
//
//    @GET
//    @Path("/{vehicleId}/latest-driver")
//    @Produces(MediaType.APPLICATION_JSON)
//    fun getVehicleWithLatestDriver(
//        @PathParam("vehicleId") vehicleId: String
//    ): VehicleDriverDTO? {
//        return vehicleService.getVehicleWithLatestDriver(vehicleId)
//    }
//
//    @GET
//    @Path("/latest-driver")
//    @Produces(MediaType.APPLICATION_JSON)
//    fun getVehicles(
//    ): VehicleDriverDTO? {
//        return vehicleService.getVehiclesWithLatestDriver()
//    }
//
//    @POST
//    fun addVehicle(vehicleDTO: VehicleDTO): Response {
//        val createdVehicle = vehicleService.addVehicle(vehicleDTO)
//        return Response.status(Response.Status.CREATED).entity(createdVehicle).build()
//    }
//
//    @DELETE
//    @Path("/{id}")
//    fun deleteVehicle(@PathParam("id") id: Long): Response {
//        vehicleService.deleteVehicle(id)
//        return Response.status(Response.Status.NO_CONTENT).build()
//    }
}
