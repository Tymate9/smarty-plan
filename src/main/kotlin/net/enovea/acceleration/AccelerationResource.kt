package net.enovea.acceleration

import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.NotFoundException
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import jakarta.ws.rs.core.Response.Status
import java.sql.Timestamp
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeParseException

@Path("/api/acceleration")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
//@Authenticated
class AccelerationResource(
    private val ggDiagramService: GGDiagramService,
    private val calibrationService: CalibrationService,
) {

    @GET
    fun listCalibrationPeriods(): Response {
        val vehicleWithPeriods = calibrationService.listCalibrationPeriods()
        return Response.ok(vehicleWithPeriods).build()
    }

    @GET
    @Path("/{id}/{beginDate}/gg-diagram")
    fun computeGGDiagram(
        @PathParam("id") deviceId: Int,
        @PathParam("beginDate") beginDate: String,
        @QueryParam("proj") proj: String,
        @QueryParam("phi") phi: Int,
        @QueryParam("theta") theta: Int,
        @QueryParam("psi") psi: Int,
    ): Response {
        val beginTimestamp = try {
            Timestamp.from(Instant.parse(beginDate))
        } catch (e: DateTimeParseException) {
            return Response.status(Status.BAD_REQUEST).entity(e.message).build()
        }

        val ggProjection = try {
            GGProjection.valueOf(proj.uppercase())
        } catch (e: IllegalArgumentException) {
            return Response.status(Status.BAD_REQUEST).entity(e.message).build()
        }

        val (begin, end) = try {
            ggDiagramService.getPeriodBeginAndEnd(deviceId, beginTimestamp)
        } catch (e: NotFoundException) {
            return Response.status(Status.NOT_FOUND).build()
        }

        val ggDiagram = ggDiagramService.computeGGDiagram(deviceId, begin, end, ggProjection, phi, theta, psi)
        return Response.ok(ggDiagram).build()
    }

}