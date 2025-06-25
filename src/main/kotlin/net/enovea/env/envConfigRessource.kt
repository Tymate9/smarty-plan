package net.enovea.env

import jakarta.inject.Inject
import org.eclipse.microprofile.config.inject.ConfigProperty
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

@Path("/api/config")
@Produces(MediaType.APPLICATION_JSON)
class EnvConfigResource @Inject constructor(
    private val keycloakConfig: KeycloakConfig,

    @ConfigProperty(name = "app.tiles-api-key")
    private val tilesApiKey: String,

    @ConfigProperty(name = "app.test-env")
    private val testEnv: Boolean,

    @ConfigProperty(name = "app.theme.default")
    private val defaultTheme: String,

    @ConfigProperty(name = "app.theme.available")
    private val availableThemes: List<String>
) {

    @GET
    fun getConfig(): Response {
        val dto = AppConfigDTO(
            keycloakConfig   = KeycloakConfigDTO(
                keycloakConfig.redirectUrl(),
                keycloakConfig.realmName(),
                keycloakConfig.authServerUrl(),
                keycloakConfig.frontendClientId()
            ),
            tilesApiKey      = tilesApiKey,
            testEnv          = testEnv,
            defaultTheme     = defaultTheme,
            availableThemes  = availableThemes
        )
        return Response.ok(dto).build()
    }
}
