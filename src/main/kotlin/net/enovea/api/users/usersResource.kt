package net.enovea.api.users

import io.quarkus.security.identity.SecurityIdentity
import jakarta.inject.Inject
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path

class User(identity: SecurityIdentity) {
    val userName: String = identity.principal.name
}

@Path("/api/users")
class UsersResource {

    @Inject
    lateinit var identity: SecurityIdentity

    @GET
    @Path("/me")
    fun me(): User {
        return User(identity)
    }
}