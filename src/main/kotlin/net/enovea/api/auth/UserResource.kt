package net.enovea.api.auth

import jakarta.annotation.security.RolesAllowed
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.core.Response

@Path("/user")
class UserResource {
    @GET
    @RolesAllowed("user", "admin")
    fun userEndpoint(): Response {
        return Response.ok("Bienvenue, Utilisateur !").build()
    }
}