package net.enovea.env

import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

@Path("/api/config")
class EnvConfigResource(val keycloakConfig: KeycloakConfig) {

    @GET
    @Path("/")
    @Produces(MediaType.APPLICATION_JSON)
    fun getConfig(): Response {
        return Response.ok(
            AppConfigDTO(
                keycloakConfig = KeycloakConfigDTO(
                    keycloakConfig.redirectUrl(),
                    keycloakConfig.realmName(),
                    keycloakConfig.authServerUrl(),
                    keycloakConfig.frontendClientId()
                ),
                tilesApiKey = System.getenv("TILES_API_KEY"),
                testEnv = !keycloakConfig.realmName().contains("Prod")
            )
        ).build()
    }

}