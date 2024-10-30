package net.enovea.api.vehicle

import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import net.enovea.dto.VehicleSummaryDTO
import net.enovea.service.VehicleService

@Path("/vehicles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class VehicleResource(private val vehicleService: VehicleService) {

    @GET
    fun getAllVehiclesDetails(): List<VehicleSummaryDTO> {
        return vehicleService.getVehiclesSummary()
    }

}