package net.enovea.acceleration

import io.quarkus.security.Authenticated
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import jakarta.ws.rs.core.Response.Status
import java.time.format.DateTimeParseException


@Path("/api/acceleration")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
class AccelerationResource(private val ggDiagramService: GGDiagramService) {

    @GET
    @Path("/{id}/gg-diagram")
    fun computeGGDiagram(@PathParam("id") deviceId: Int,
                         @QueryParam("beginDate") beginDate: String,
                         @QueryParam("endDate") endDate: String,
                         @QueryParam("phi") phi: Int,
                         @QueryParam("theta") theta: Int,
                         @QueryParam("psi") psi: Int
    ): Response {
        try {
            val ggDiagram = ggDiagramService.computeGGDiagram(deviceId, beginDate, endDate, phi, theta, psi)
            return Response.ok(ggDiagram).build()
        } catch (e: DateTimeParseException) {
            return Response.status(Status.BAD_REQUEST).entity(e.message).build()
        }
    }
}