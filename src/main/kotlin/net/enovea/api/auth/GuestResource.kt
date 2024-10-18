package net.enovea.api.auth

import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.core.Context
import jakarta.ws.rs.core.Response
import jakarta.ws.rs.core.SecurityContext


@Path("/guest")
class GuestResource {
    @GET
    fun guestEndpoint(@Context securityContext: SecurityContext): Response {
        return if (securityContext.userPrincipal == null) {
            Response.ok("Guest").build()
        } else if (securityContext.isUserInRole("admin")) {
            Response.ok("Admin").build()
        } else if (securityContext.isUserInRole("user")) {
            Response.ok("User").build()
        } else {
            Response.status(Response.Status.FORBIDDEN).build()
        }
    }
}