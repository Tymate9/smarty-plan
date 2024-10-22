package net.enovea.api.poi

import jakarta.annotation.security.PermitAll
import jakarta.json.Json
import jakarta.json.JsonString
import jakarta.transaction.Transactional
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.hibernate.type.format.jackson.JacksonJsonFormatMapper
import org.jose4j.json.internal.json_simple.JSONObject

@Path("/poi")
class PointOfInterestResource {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    fun getNearPointsOfInterest(): List<PointOfInterestEntity> {
        return PointOfInterestEntity.listAll()
    }
}