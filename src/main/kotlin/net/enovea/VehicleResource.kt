package net.enovea

import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import net.enovea.dto.VehicleDTO
import net.enovea.service.VehicleService

@Path("/vehicles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class VehicleResource(private val vehicleService: VehicleService) {

    @GET
    fun getAllVehicles(): List<VehicleDTO> {
        return vehicleService.getAllVehicles()
    }
}