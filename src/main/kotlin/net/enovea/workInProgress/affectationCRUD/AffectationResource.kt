package net.enovea.workInProgress.affectationCRUD

import com.fasterxml.jackson.annotation.JsonValue
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import io.quarkus.security.Authenticated
import jakarta.transaction.Transactional
import jakarta.validation.ConstraintViolation
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import net.enovea.workInProgress.common.ICRUDResource
import jakarta.validation.Validator
import net.enovea.driver.DriverEntity
import net.enovea.driver.driverTeam.DriverTeamEntity
import net.enovea.driver.driverTeam.DriverTeamId
import net.enovea.team.TeamEntity
import net.enovea.vehicle.VehicleEntity
import net.enovea.vehicle.vehicleDriver.VehicleDriverEntity
import net.enovea.vehicle.vehicleDriver.VehicleDriverId
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import net.enovea.vehicle.vehicleTeam.VehicleTeamId
import java.sql.Timestamp
import kotlin.reflect.KClass

interface IAffectationPanacheEntity<
        S : PanacheEntityBase,
        T : PanacheEntityBase,
        ID
        > : IAffectationEntity<S, T, ID>, PanacheEntityBase

sealed class AffectationType< E, ID : Any, S : PanacheEntityBase, T : PanacheEntityBase>(
    val entityClass: KClass<E>,
    val idClass: KClass<ID>,
    val subjectClass: KClass<S>,
    val targetClass: KClass<T>
)
        where E : PanacheEntityBase,
              E : IAffectationEntity<S, T, ID>
{

    /**
     * Cas 1 : Affectation d'un Driver à un Vehicle
     */
    data object DRIVER_VEHICLE : AffectationType<
            VehicleDriverEntity,
            VehicleDriverId,
            DriverEntity,
            VehicleEntity
            >(
        entityClass = VehicleDriverEntity::class,
        idClass = VehicleDriverId::class,
        subjectClass = DriverEntity::class,
        targetClass = VehicleEntity::class
    )

    /**
     * Cas 2 : Affectation d'un Driver à une Team
     */
    data object DRIVER_TEAM : AffectationType<
            DriverTeamEntity,
            DriverTeamId,
            DriverEntity,
            TeamEntity
            >(
        entityClass = DriverTeamEntity::class,
        idClass = DriverTeamId::class,
        subjectClass = DriverEntity::class,
        targetClass = TeamEntity::class
    )

    /**
     * Cas 3 : Affectation d'un Vehicle à une Team
     */
    data object VEHICLE_TEAM : AffectationType<
            VehicleTeamEntity,
            VehicleTeamId,
            VehicleEntity,
            TeamEntity
            >(
        entityClass = VehicleTeamEntity::class,
        idClass = VehicleTeamId::class,
        subjectClass = VehicleEntity::class,
        targetClass = TeamEntity::class
    )

    /**
     * Cette méthode permet d'exposer seulement le nom du type lors de la (dé)sérialisation.
     */
    @JsonValue
    fun asString(): String = when(this) {
        DRIVER_VEHICLE -> "DRIVER_VEHICLE"
        DRIVER_TEAM -> "DRIVER_TEAM"
        VEHICLE_TEAM -> "VEHICLE_TEAM"
    }

    /**
     * Méthode utilitaire pour retrouver un AffectationType à partir d'une string.
     * Remplace l'usage d'un `valueOf` que l'on pourrait avoir avec une enum.
     */
    companion object {
        fun fromString(value: String): AffectationType<*, *, *, *>? {
            return when (value.uppercase()) {
                "DRIVER_VEHICLE" -> DRIVER_VEHICLE
                "DRIVER_TEAM"    -> DRIVER_TEAM
                "VEHICLE_TEAM"   -> VEHICLE_TEAM
                else -> null
            }
        }
    }
}


@Path("/api/affectations/{type}")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
class AffectationResource (
    private val affectationService: AffectationService,
    private val validator: Validator
) : ICRUDResource<AffectationForm, AffectationDTO<*,*>, String> {

    // Injection du paramètre de chemin "type" comme attribut de classe
    @PathParam("type")
    lateinit var type: String

    @GET
    @Path("/{id}")
    override fun readOne(@PathParam("id") id: String): Response {
        // On récupère l'objet sealed class (projection étoile)
        val rawType = AffectationType.fromString(type)
            ?: return Response.status(Response.Status.BAD_REQUEST)
                .entity("Type d'affectation inconnu : $type")
                .build()

        // Cast explicite vers la forme paramétrique souhaitée
        @Suppress("UNCHECKED_CAST")
        val typed = rawType as AffectationType<
                IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, Any>,
                Any,
                PanacheEntityBase,
                PanacheEntityBase
                >

        // Convertir la chaîne id en l'ID requis (par ex. VehicleDriverId ou DriverTeamId…)
        val convertedId = convertId(id, typed.idClass)

        // Appel du service
        val dto = affectationService.getById(
            typed.entityClass, // KClass<IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, Any>>
            convertedId        // Any
        )
        return Response.ok(dto).build()
    }

    /**
     * Fonction utilitaire pour convertir l'id (en String) dans le type attendu.
     * Vous pouvez étendre cette fonction selon vos besoins.
     */
    private fun convertId(id: String, idClass: KClass<*>): Any {
        return when (idClass) {
            String::class -> id
            Int::class -> id.toInt()

            // --- Cas des identifiants composites spécifiques ---
            VehicleDriverId::class -> parseVehicleDriverId(id)
            DriverTeamId::class    -> parseDriverTeamId(id)
            VehicleTeamId::class   -> parseVehicleTeamId(id)

            // Sinon, on laisse tel quel ou on lance une exception
            else -> throw IllegalArgumentException("Type d'identifiant non géré : ${idClass.simpleName}")
        }
    }

    private fun parseDriverTeamId(idStr: String): DriverTeamId {
        // On s'attend à un format ex: "123-456-1678460293000"
        val parts = idStr.split('-')
        require(parts.size == 3) {
            "Format d'ID driverTeam incorrect. Attendu : driverId-teamId-epochTime"
        }
        val driverId = parts[0].toInt()
        val teamId   = parts[1].toInt()
        val epoch    = parts[2].toLong()

        return DriverTeamId(
            driverId = driverId,
            teamId   = teamId,
            startDate = Timestamp(epoch)
        )
    }

    private fun parseVehicleDriverId(idStr: String): VehicleDriverId {
        val parts = idStr.split('-')
        require(parts.size == 3) {
            "Format d'ID vehicleDriver incorrect. Attendu : vehicleId-driverId-epochTime"
        }
        val vehicleId = parts[0]
        val driverId  = parts[1].toInt()
        val epoch     = parts[2].toLong()

        return VehicleDriverId(
            vehicleId = vehicleId,
            driverId  = driverId,
            startDate = Timestamp(epoch)
        )
    }

    private fun parseVehicleTeamId(idStr: String): VehicleTeamId {
        val parts = idStr.split('-')
        require(parts.size == 3) {
            "Format d'ID vehicleTeam incorrect. Attendu : vehicleId-teamId-epochTime"
        }
        val vehicleId = parts[0]
        val teamId    = parts[1].toInt()
        val epoch     = parts[2].toLong()

        return VehicleTeamId(
            vehicleId = vehicleId,
            teamId    = teamId,
            startDate = Timestamp(epoch)
        )
    }

    /**
     * Créer une nouvelle affectation.
     */
    @POST
    @Transactional
    override fun create(form: AffectationForm): Response {
        // Récupération du sealed object
        val rawType = AffectationType.fromString(type)
            ?: return Response.status(Response.Status.BAD_REQUEST)
                .entity("Type d'affectation inconnu : $type")
                .build()

        // Cast explicite
        @Suppress("UNCHECKED_CAST")
        val typed = rawType as AffectationType<
                IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, Any>,
                Any,
                PanacheEntityBase,
                PanacheEntityBase
                >

        // On range le type dans le formulaire
        form.classInfo = typed

        // Validation du formulaire
        val violations: Set<ConstraintViolation<AffectationForm>> = validator.validate(form)
        if (violations.isNotEmpty()) {
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }

        // Appel du service
        val createdAffectation = affectationService.create(
            typed.entityClass, // KClass<E> où E : IAffectationPanacheEntity
            form
        )
        return Response.ok(createdAffectation).build()
    }

    @PUT
    @Path("/{id}")
    @Transactional
    override fun update(@PathParam("id") id: String, form: AffectationForm): Response {
        // 1) Récupération de l'objet scellé depuis la string "type"
        val rawType = AffectationType.fromString(type)
            ?: return Response.status(Response.Status.BAD_REQUEST)
                .entity("Type d'affectation inconnu : $type")
                .build()

        // 2) Cast explicite de la projection étoile vers un type paramétrique
        @Suppress("UNCHECKED_CAST")
        val typed = rawType as AffectationType<
                IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, Any>,
                Any,
                PanacheEntityBase,
                PanacheEntityBase
                >

        // 3) Injecter l'objet sealed dans le formulaire
        form.classInfo = typed

        // 4) Valider le formulaire
        val violations: Set<ConstraintViolation<AffectationForm>> = validator.validate(form)
        if (violations.isNotEmpty()) {
            val errors = violations.map { "${it.propertyPath}: ${it.message}" }
            return Response.status(Response.Status.BAD_REQUEST).entity(errors).build()
        }

        // 5) Convertir l'id textuel en l'ID attendu (typed.idClass)
        val convertedId = convertId(id, typed.idClass)

        // 6) Appel du service
        val updatedAffectation = affectationService.update(
            typed.entityClass,  // KClass<E> où E : IAffectationPanacheEntity
            convertedId,        // ID
            form
        )

        // Retour 200 OK avec le DTO
        return Response.ok(updatedAffectation).build()
    }

    /**
     * Supprimer une affectation.
     */
    @DELETE
    @Path("/{id}")
    @Transactional
    override fun delete(@PathParam("id") id: String): Response {
        // Récupération de l'objet sealed class depuis la string "type"
        val rawType = AffectationType.fromString(type)
            ?: return Response.status(Response.Status.BAD_REQUEST)
                .entity("Type d'affectation inconnu : $type")
                .build()

        // On cast depuis AffectationType<*,*,*,*> vers une version paramétrique
        @Suppress("UNCHECKED_CAST")
        val typed = rawType as AffectationType<
                IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, Any>,
                Any,
                PanacheEntityBase,
                PanacheEntityBase
                >

        // Conversion de l'id textuel en l'ID attendu
        val convertedId = convertId(id, typed.idClass)

        // Appel du service
        val deletedAffectation = affectationService.delete(
            typed.entityClass,  // KClass<E>
            convertedId         // ID
        )
        return Response.ok(deletedAffectation).build()
    }
}