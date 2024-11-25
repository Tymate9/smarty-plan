package net.enovea.api.env

import org.eclipse.microprofile.config.inject.ConfigProperty
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.Response

@Path("/api/envConfig")
@Produces("application/json")
@Consumes("application/json")
class EnvConfigResource {

    @ConfigProperty(name = "quarkus.profile")
    lateinit var env: String

    @GET
    @Path("/keycloak")
    fun getConfig(): Response {
        val config = when (env) {
            "dev" -> keycloakConfigDTO(
                logoutURL = "http://localhost:8080/",
                realmName = "NormandieManutention",
                authServerURL = "http://localhost:45180/",
                clientId = "smarty-plan-front"
            )
            "test" -> keycloakConfigDTO(
                logoutURL = "https://smartyplan.staging.nm.enovea.net/",
                realmName = "SmartyPlan-Staging",
                authServerURL = "https://keycloak.staging.nm.enovea.net/",
                clientId = "smarty-plan-front"
            )
            "prod" -> keycloakConfigDTO(
                logoutURL = "https://smartyplan.staging.nm.enovea.net/",
                realmName = "SmartyPlan-Staging",
                authServerURL = "https://keycloak.staging.nm.enovea.net/",
                clientId = "smarty-plan-front"
            )
            else -> {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity("Unknown environment: $env")
                    .build()
            }
        }

        return Response.ok(config).build()
    }

}