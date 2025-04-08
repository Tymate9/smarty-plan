package net.enovea.api.auth

import io.quarkus.security.Authenticated
import jakarta.inject.Inject
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.Context
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.SecurityContext
import org.eclipse.microprofile.jwt.JsonWebToken



@Path("/admin")
class AdminResource {
    @Inject
    lateinit var jwt: JsonWebToken

    @GET
    @Authenticated
    @Produces(MediaType.TEXT_PLAIN)
    fun adminEndpoint(@Context ctx: SecurityContext): String {
        // Extraire les rôles depuis realm_access.roles en tant que Map
        val realmAccess = jwt.claim<Map<String, Any>>("realm_access").orElse(null)
        val roles = (realmAccess?.get("roles") as? List<String>) ?: emptyList()

        // Obtenir les informations utilisateur
        val userName = jwt.name ?: "anonymous"
        val fullName = jwt.claim<String>("name").orElse("anonymous")
        val email = jwt.claim<String>("email").orElse("no-email@example.com")

        // Afficher les informations
        return "Hello, $fullName ($email)!! Your roles are: ${roles.joinToString(", ")}"
    }
}
