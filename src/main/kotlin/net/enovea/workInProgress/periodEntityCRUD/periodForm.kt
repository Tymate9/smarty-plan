package net.enovea.workInProgress.periodEntityCRUD

import com.fasterxml.jackson.annotation.JsonFormat
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonValue
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.transaction.Transactional
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import jakarta.validation.constraints.NotNull
import net.enovea.driver.DriverEntity
import net.enovea.driver.driverUntrackedPeriod.DriverUntrackedPeriodEntity
import net.enovea.driver.driverUntrackedPeriod.DriverUntrackedPeriodId
import net.enovea.vehicle.VehicleEntity
import net.enovea.vehicle.vehicleUntrackedPeriod.VehicleUntrackedPeriodEntity
import net.enovea.vehicle.vehicleUntrackedPeriod.VehicleUntrackedPeriodId
import java.sql.Timestamp
import java.time.LocalDateTime
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObjectInstance

interface IPanachePeriodEntity<
        R : PanacheEntityBase,
        ID
        > : IPeriodEntity<R, ID>, PanacheEntityBase

sealed class PeriodType<E, ID : Any, R : PanacheEntityBase>(
    val entityClass: KClass<E>,
    val idClass: KClass<ID>,
    val resourceClass: KClass<R>
) where E : PanacheEntityBase, E : IPeriodEntity<R, ID> {

    /**
     * Cas 1 : Période associée à un Driver.
     */
    data object DRIVER_UP : PeriodType<DriverUntrackedPeriodEntity, DriverUntrackedPeriodId, DriverEntity>(
        entityClass = DriverUntrackedPeriodEntity::class,
        idClass = DriverUntrackedPeriodId::class,
        resourceClass = DriverEntity::class
    )

    /**
     * Cas 2 : Période associée à un Vehicle.
     */
    data object VEHICLE_UP : PeriodType<VehicleUntrackedPeriodEntity, VehicleUntrackedPeriodId, VehicleEntity>(
        entityClass = VehicleUntrackedPeriodEntity::class,
        idClass = VehicleUntrackedPeriodId::class,
        resourceClass = VehicleEntity::class
    )

    /**
     * Méthode permettant d'exposer le type sous forme de chaîne lors de la (dé)sérialisation.
     */
    @JsonValue
    fun asString(): String = when (this) {
        DRIVER_UP  -> "DRIVER_UP"
        VEHICLE_UP -> "VEHICLE_UP"
    }

    companion object {
        /**
         * Permet de retrouver un PeriodType à partir d'une chaîne.
         */
        fun fromString(value: String): PeriodType<*, *, *>? = when (value.uppercase()) {
            "DRIVER_UP"  -> DRIVER_UP
            "VEHICLE_UP" -> VEHICLE_UP
            else -> null
        }
    }
}

data class PeriodForm(

    @field:NotNull(message = "L'identifiant de la ressource est requis.")
    val resourceId: Any?,

    @field:NotNull(message = "La date de début doit être renseignée.")
    @field:JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSX", timezone = "UTC")
    val startDate: Timestamp?,

    @field:JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSX", timezone = "UTC")
    val endDate: Timestamp? = null,

    @JsonIgnore
    var classInfo: PeriodType<*,*,*>? = null
)

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [PeriodFormValidator::class])
annotation class ValidPeriodForm(
    val message: String = "Formulaire de période non suivie invalide.",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class PeriodFormValidator : ConstraintValidator<ValidPeriodForm, PeriodForm> {

    @Transactional
    override fun isValid(form: PeriodForm, context: ConstraintValidatorContext): Boolean {
        var isValid = true
        context.disableDefaultConstraintViolation()

        // 1. Vérifier que startDate est renseigné et que, si endDate est fourni, startDate est antérieur à endDate.
        if (form.startDate == null) {
            context.buildConstraintViolationWithTemplate("La date de début est obligatoire.")
                .addPropertyNode("startDate")
                .addConstraintViolation()
            isValid = false
        } else if (form.endDate != null && !form.startDate.before(form.endDate)) {
            context.buildConstraintViolationWithTemplate("La date de début doit être antérieure à la date de fin.")
                .addPropertyNode("endDate")
                .addConstraintViolation()
            isValid = false
        }

        // 2. Vérifier que la classe de l'entité est renseignée et que la ressource existe en base de données.
        if (form.classInfo == null) {
            context.buildConstraintViolationWithTemplate("La classe de l'entité doit être renseignée dans le formulaire.")
                .addPropertyNode("classInfo")
                .addConstraintViolation()
            isValid = false
        } else if (!existsInDatabase(form.classInfo!!.resourceClass, form.resourceId)) {
            context.buildConstraintViolationWithTemplate("L'identifiant de la ressource n'existe pas en base.")
                .addPropertyNode("resourceId")
                .addConstraintViolation()
            isValid = false
        }

        return isValid
    }

    /**
     * Vérifie l'existence en base de données d'une entité via son compagnon Panache.
     * On utilise la méthode "findById" via reflection.
     */
    private fun existsInDatabase(entityClass: KClass<*>, id: Any?): Boolean {
        if (id == null) return false

        // Récupérer le compagnon de l'entité (instance de PanacheCompanionBase)
        val companionInstance = entityClass.companionObjectInstance
        if (companionInstance !is PanacheCompanionBase<*, *>) {
            return false
        }
        // Recherche de la méthode "findById" dans le compagnon
        val findByIdMethod = companionInstance::class.members.firstOrNull { it.name == "findById" }
        val result = findByIdMethod?.call(companionInstance, id)
        return result != null
    }
}