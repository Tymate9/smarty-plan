package net.enovea.period

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import io.quarkus.security.Authenticated
import jakarta.enterprise.context.RequestScoped
import jakarta.transaction.Transactional
import jakarta.validation.ConstraintViolation
import jakarta.validation.Validator
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.driver.driverUntrackedPeriod.DriverUntrackedPeriodId
import net.enovea.vehicle.vehicleUntrackedPeriod.VehicleUntrackedPeriodId
import net.enovea.commons.ICRUDResource
import java.sql.Timestamp
import kotlin.reflect.KClass

@Path("/api/periods/{type}")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Authenticated
class PeriodResource(
    private val periodService: PeriodService,
    private val validator: Validator
) : ICRUDResource<PeriodForm, PeriodDTO<*>, String> {

    @PathParam("type")
    private lateinit var type: String

    @GET
    @Path("/{id}")
    override fun readOne(@PathParam("id") id: String): Response {
        // Récupération du sealed class PeriodType depuis la chaîne de type
        val rawType = PeriodType.fromString(type)
            ?: return Response.status(Response.Status.BAD_REQUEST)
                .entity("Type de période inconnu : $type")
                .build()

        // Cast explicite vers la forme paramétrique souhaitée
        @Suppress("UNCHECKED_CAST")
        val typed = rawType as PeriodType<IPanachePeriodEntity<PanacheEntityBase, Any>, Any, PanacheEntityBase>

        // Conversion de l'id textuel en l'ID requis (par exemple, DriverUntrackedPeriodId ou VehicleUntrackedPeriodId)
        val convertedId = convertId(id, typed.idClass)

        // Appel du service
        val dto = periodService.getById(
            typed.entityClass, // KClass<IPanachePeriodEntity<PanacheEntityBase, Any>>
            convertedId        // ID
        )
        return Response.ok(dto).build()
    }

    @POST
    @Transactional
    override fun create(form: PeriodForm): Response {
        // Récupération du sealed object PeriodType
        val rawType = PeriodType.fromString(type)
            ?: return Response.status(Response.Status.BAD_REQUEST)
                .entity("Type de période inconnu : $type")
                .build()

        @Suppress("UNCHECKED_CAST")
        val typed = rawType as PeriodType<IPanachePeriodEntity<PanacheEntityBase, Any>, Any, PanacheEntityBase>

        // (Optionnel) Si PeriodForm possède un champ mutable pour le type, on pourrait l'assigner ici
        // form.periodType = typed

        // Validation du formulaire
        val violations: Set<ConstraintViolation<PeriodForm>> = validator.validate(form)
        if (violations.isNotEmpty()) {
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }

        // Appel du service
        return try {
            val createdPeriod = periodService.create(
                typed.entityClass,
                form
            )
            Response.ok(createdPeriod).build()
        } catch (e: jakarta.persistence.EntityExistsException) {
            Response.status(Response.Status.CONFLICT)
                .entity("La période existe déjà: ${e.message}")
                .build()
        } catch (e: jakarta.persistence.PersistenceException) {
            Response.status(Response.Status.CONFLICT)
                .entity("Erreur de persistance: ${e.message}")
                .build()
        }
    }

    @PUT
    @Path("/{id}")
    @Transactional
    override fun update(@PathParam("id") id: String, form: PeriodForm): Response {
        // 1) Récupération du sealed class PeriodType
        val rawType = PeriodType.fromString(type)
            ?: return Response.status(Response.Status.BAD_REQUEST)
                .entity("Type de période inconnu : $type")
                .build()

        @Suppress("UNCHECKED_CAST")
        val typed = rawType as PeriodType<IPanachePeriodEntity<PanacheEntityBase, Any>, Any, PanacheEntityBase>

        // 2) Validation du formulaire
        val violations: Set<ConstraintViolation<PeriodForm>> = validator.validate(form)
        if (violations.isNotEmpty()) {
            val errors = violations.joinToString(", ") { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }

        // 3) Conversion de l'id textuel en l'ID attendu
        val convertedId = convertId(id, typed.idClass)

        // 4) Appel du service update avec gestion des exceptions
        return try {
            val updatedPeriod = periodService.update(
                typed.entityClass,
                convertedId,
                form
            )
            Response.ok(updatedPeriod).build()
        } catch (e: jakarta.persistence.EntityExistsException) {
            Response.status(Response.Status.CONFLICT)
                .entity("Conflit lors de la mise à jour : ${e.message}")
                .build()
        } catch (e: jakarta.persistence.PersistenceException) {
            Response.status(Response.Status.CONFLICT)
                .entity("Erreur de persistance lors de la mise à jour : ${e.message}")
                .build()
        } catch (e: Exception) {
            Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("Erreur inattendue lors de la mise à jour : ${e.message}")
                .build()
        }
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    override fun delete(@PathParam("id") id: String): Response {
        // Récupération du sealed class PeriodType depuis la chaîne "type"
        val rawType = PeriodType.fromString(type)
            ?: return Response.status(Response.Status.BAD_REQUEST)
                .entity("Type de période inconnu : $type")
                .build()

        @Suppress("UNCHECKED_CAST")
        val typed = rawType as PeriodType<IPanachePeriodEntity<PanacheEntityBase, Any>, Any, PanacheEntityBase>

        // Conversion de l'id textuel en l'ID attendu
        val convertedId = convertId(id, typed.idClass)

        // Appel du service
        val deletedPeriod = periodService.delete(
            typed.entityClass,
            convertedId
        )
        return Response.ok(deletedPeriod).build()
    }

    @GET
    @Path("/list/resource")
    fun listByResource(@QueryParam("resourceId") resourceId: String?): Response {
        if (resourceId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Le paramètre resourceId est requis")
                .build()
        }

        val rawType = PeriodType.fromString(type)
            ?: return Response.status(Response.Status.BAD_REQUEST)
                .entity("Type de période inconnu : $type")
                .build()

        @Suppress("UNCHECKED_CAST")
        val typed = rawType as PeriodType<IPanachePeriodEntity<PanacheEntityBase, Any>, Any, PanacheEntityBase>

        val periods = periodService.listByResource(typed.entityClass, resourceId)
        return Response.ok(periods).build()
    }

    // ==================================================================
    // Fonction utilitaire pour convertir l'identifiant textuel en l'ID attendu
    // ==================================================================
    private fun convertId(id: String, idClass: KClass<*>): Any {
        return when (idClass) {
            String::class -> id
            Int::class -> id.toInt()
            // Cas des identifiants composites pour Driver et Vehicle
            DriverUntrackedPeriodId::class -> parseDriverUntrackedPeriodId(id)
            VehicleUntrackedPeriodId::class -> parseVehicleUntrackedPeriodId(id)
            else -> throw IllegalArgumentException("Type d'identifiant non géré : ${idClass.simpleName}")
        }
    }

    private fun parseDriverUntrackedPeriodId(idStr: String): DriverUntrackedPeriodId {
        // On s'attend à un format "driverId_epochTime"
        val parts = idStr.split('_')
        require(parts.size == 2) {
            "Format d'ID DriverUntrackedPeriod incorrect. Attendu : driverId_epochTime"
        }
        val driverId = parts[0].toInt()
        val epoch = parts[1].toLong()
        // Conversion de l'epoch en LocalDateTime (exemple avec ZoneOffset.UTC)
        val startDate = Timestamp(epoch)
        return DriverUntrackedPeriodId(driverId = driverId, startDate = startDate)
    }

    private fun parseVehicleUntrackedPeriodId(idStr: String): VehicleUntrackedPeriodId {
        // On s'attend à un format "vehicleId_epochTime"
        val parts = idStr.split('_')
        require(parts.size == 2) {
            "Format d'ID VehicleUntrackedPeriod incorrect. Attendu : vehicleId_epochTime"
        }
        val vehicleId = parts[0]
        val epoch = parts[1].toLong()
        val startDate = Timestamp(epoch)
        return VehicleUntrackedPeriodId(vehicleId = vehicleId, startDate = startDate)
    }
}