package net.enovea.api.admin

import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import jakarta.inject.Inject
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType

@Path("/api/admin")
@Authenticated
class AdminResource {
    @Inject
    lateinit var identity: SecurityIdentity

    @GET
    @Path("/me")
    @Produces(MediaType.TEXT_PLAIN)
    fun admin(): String {
        return "Granted";
    }
}