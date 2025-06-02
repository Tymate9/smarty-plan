package net.enovea.env

import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.eclipse.microprofile.config.inject.ConfigProperty

@Path("/api/config")
class EnvConfigResource(
    val keycloakConfig: KeycloakConfig,
    @ConfigProperty(name = "googleapis.tiles.api.key") val tilesApiKey: String,
) {

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
                tilesApiKey = tilesApiKey,
                testEnv = !keycloakConfig.realmName().contains("Prod")
            )
        ).build()
    }

}