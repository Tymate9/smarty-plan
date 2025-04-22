package net.enovea.driver

import io.quarkus.security.Authenticated
import jakarta.annotation.security.RolesAllowed
import jakarta.transaction.Transactional
import jakarta.validation.ConstraintViolation
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.team.TeamService
import net.enovea.commons.ICRUDResource
import jakarta.validation.Validator

@Path("/api/drivers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
class DriverResource(
    private val driverService: DriverService,
    private val teamService: TeamService,
    private val validator: Validator
) : ICRUDResource<DriverForm, DriverDTO, Int> {

    @GET
    fun getDrivers(): Response {
        val drivers = driverService.getAllDrivers()
        return Response.ok(drivers).build()
    }

    @GET
    @Path("/affected")
    fun getAffectedDrivers(@QueryParam("agencyIds") agencyIds: List<String>? = null): List<DriverDTO> {
        return driverService.getDrivers(agencyIds)
    }

    @GET
    @Path("/authorized-data")
    fun getAuthorizedData() : Response {
        val list = teamService.getDriverTreeAtDate()
        return Response.ok(list).build()
    }

    @GET
    @Path("/count")
    fun getCount() : Response {
        return Response.ok(DriverEntity.count()).build()
    }

    @GET
    @Path("/stats")
    fun getStats() : Response {
        return Response.ok(driverService.getDriverStats()).build()
    }

    /**
     * Récupérer un conducteur par son ID (ReadOne).
     * Retourne 404 si l'entité n'existe pas.
     */
    @GET
    @Path("/{id}")
    override fun readOne(@PathParam("id") id: Int): Response {
        // Le service lève NotFoundException si l'entité n'existe pas.
        val driverDTO = driverService.getById(id)
        return Response.ok(driverDTO).build()
    }

    /**
     * Créer un nouveau conducteur (Create).
     * Retourne 400 si le formulaire est invalide.
     */
    @RolesAllowed("NOT_ALLOWED_YET")
    @POST
    @Transactional
    override fun create(form: DriverForm): Response {
        // Valider manuellement le formulaire
        val violations: Set<ConstraintViolation<DriverForm>> = validator.validate(form)
        if (violations.isNotEmpty()) {
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }
        val createdDriver = driverService.create(form)
        return Response.ok(createdDriver).build()
    }

    /**
     * Mettre à jour un conducteur existant (Update).
     * Retourne 400 si le formulaire est invalide et 404 si l'entité n'existe pas.
     */
    @RolesAllowed("NOT_ALLOWED_YET")
    @PUT
    @Transactional
    @Path("/{id}")
    override fun update(@PathParam("id") id: Int, form: DriverForm): Response {
        // Forcer l'ID dans le formulaire
        form.id = id

        // Valider le formulaire
        val violations: Set<ConstraintViolation<DriverForm>> = validator.validate(form)
        if (violations.isNotEmpty()) {
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }
        val updatedDriver = driverService.update(form)
        return Response.ok(updatedDriver).build()
    }

    /**
     * Supprimer un conducteur (Delete).
     * Retourne 404 si l'entité n'existe pas.
     * Retourne le DTO du conducteur supprimé pour permettre une éventuelle annulation.
     */
    @RolesAllowed("NOT_ALLOWED_YET")
    @DELETE
    @Path("/{id}")
    @Transactional
    override fun delete(@PathParam("id") id: Int): Response {
        return try {
            val deletedDriver = driverService.delete(id)
            Response.ok(deletedDriver).build()
        } catch (ex: NotFoundException) {
            Response.status(Response.Status.NOT_FOUND)
                .entity("Driver with id=$id not found")
                .build()
        } catch (ex: Exception) {
            val conflict = when {
                ex is org.hibernate.exception.ConstraintViolationException -> true
                ex.cause is org.hibernate.exception.ConstraintViolationException -> true
                else -> false
            }
            if (conflict) {
                Response.status(Response.Status.CONFLICT)
                    .entity("Foreign key conflict: Driver cannot be deleted")
                    .build()
            } else {
                Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Internal server error: ${ex.message}")
                    .build()
            }
        }
    }
}
