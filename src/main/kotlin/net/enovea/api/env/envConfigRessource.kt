package net.enovea.api.env

import org.eclipse.microprofile.config.inject.ConfigProperty
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.Response

@Path("/api/config")
@Produces("application/json")
@Consumes("application/json")
class EnvConfigResource(val keycloakConfig: KeycloakConfig) {

    @GET
    @Path("/")
    fun getConfig(): Response {
        return Response.ok(AppConfig(keycloakConfig)).build()
    }

}