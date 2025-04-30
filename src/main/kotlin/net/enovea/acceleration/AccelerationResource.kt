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
    private val calibrationService: CalibrationService) {

    @GET
    @Path("/{id}/{beginDate}/gg-diagram")
    fun computeGGDiagram(@PathParam("id") deviceId: Int,
                         @PathParam("beginDate") beginDate: String,
                         @QueryParam("phi") phi: Int,
                         @QueryParam("theta") theta: Int,
                         @QueryParam("psi") psi: Int
    ): Response {
        try {
            val beginDateUTC = LocalDateTime.ofInstant(Instant.parse(beginDate), ZoneOffset.UTC)
            val (begin, end) = ggDiagramService.getPeriodBeginAndEnd(deviceId, beginDateUTC)
            val ggDiagram = ggDiagramService.computeGGDiagram(deviceId, begin, end, phi, theta, psi)
            return Response.ok(ggDiagram).build()
        } catch (e: DateTimeParseException) {
            return Response.status(Status.BAD_REQUEST).entity(e.message).build()
        } catch (e: NotFoundException) {
            return Response.status(Status.NOT_FOUND).build()
        }
    }

    @GET
    fun listCalibrationPeriods(): Response {
        val vehicleWithPeriods = calibrationService.listCalibrationPeriods()
        return Response.ok(vehicleWithPeriods).build()
    }
}