package net.enovea

import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import net.enovea.dto.VehicleDTOsummary
import net.enovea.service.VehicleService

@Path("/vehicles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class VehicleResource(private val vehicleService: VehicleService) {

    @GET
    fun getAllVehiclesDetails(): List<VehicleDTOsummary> {
        return vehicleService.getVehiclesSummary()
    }

}