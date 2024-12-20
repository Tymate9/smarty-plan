package net.enovea.common.geo

import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType

@Path("/api/tiles")
class TilesResource {
    @GET
    @Path("/api-key")
    @Produces(MediaType.APPLICATION_JSON)
    fun getApiKey(): Map<String, String> {
        return mapOf("api_key" to System.getenv("TILES_API_KEY"))
    }
}