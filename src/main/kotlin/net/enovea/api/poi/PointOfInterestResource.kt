package net.enovea.api.poi

import jakarta.ws.rs.GET
import jakarta.ws.rs.Path

@Path("/poi")
class PointOfInterestResource {

    @GET
    fun getNearPointsOfInterest(): List<PointOfInterestEntity> {
        return PointOfInterestEntity.getAllWithLittleRadius()
    }
}