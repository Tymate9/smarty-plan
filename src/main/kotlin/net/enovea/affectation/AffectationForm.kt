package net.enovea.affectation

import com.fasterxml.jackson.annotation.JsonFormat
import com.fasterxml.jackson.annotation.JsonIgnore
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.transaction.Transactional
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import jakarta.validation.constraints.NotNull
import java.sql.Timestamp
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObjectInstance

@ValidAffectationForm
data class AffectationForm(

    @field:NotNull(message = "L'identifiant du sujet est requis.")
    var subjectId: Any?,

    @field:NotNull(message = "L'identifiant de la cible est requis.")
    var targetId: Any?,

    @field:NotNull(message = "La date de début doit être renseignée.")
    @field:JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSX", timezone = "UTC")
    var startDate: Timestamp?,

    var endDate: Timestamp? = null,

    @JsonIgnore
    var classInfo: AffectationType<*, *, *, *>? = null,
)

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [AffectationFormValidator::class])
annotation class ValidAffectationForm(
    val message: String = "Formulaire d'affectation invalide.",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class AffectationFormValidator : ConstraintValidator<ValidAffectationForm, AffectationForm> {

    @Transactional
    override fun isValid(form: AffectationForm, context: ConstraintValidatorContext): Boolean {
        var isValid = true
        context.disableDefaultConstraintViolation()

        // 1.startDate doit être antérieure à endDate
        if (form.startDate == null) {
            context.buildConstraintViolationWithTemplate("La date de début est obligatoire.")
                .addPropertyNode("startDate")
                .addConstraintViolation()
            isValid = false
        } else {
            // Comparaison uniquement si endDate n’est pas null
            if (form.endDate != null && !form.startDate!!.before(form.endDate)) {
                context.buildConstraintViolationWithTemplate("La date de début doit être antérieure à la date de fin.")
                    .addPropertyNode("endDate")
                    .addConstraintViolation()
                isValid = false
            }
        }

        // 2. Vérifier l'existence en base du subjectId et targetId via les classes fournies
        if (form.classInfo?.subjectClass == null) {
            context.buildConstraintViolationWithTemplate("La classe de l'entité sujet doit être renseignée dans le formulaire.")
                .addPropertyNode("subjectEntityClass")
                .addConstraintViolation()
            isValid = false
        } else {
            if (!existsInDatabase(form.classInfo!!.subjectClass, form.subjectId)) {
                context.buildConstraintViolationWithTemplate("L'identifiant du sujet n'existe pas en base.")
                    .addPropertyNode("subjectId")
                    .addConstraintViolation()
                isValid = false
            }
        }

        if (form.classInfo?.targetClass == null) {
            context.buildConstraintViolationWithTemplate("La classe de l'entité cible doit être renseignée dans le formulaire.")
                .addPropertyNode("targetEntityClass")
                .addConstraintViolation()
            isValid = false
        } else {
            if (!existsInDatabase(form.classInfo!!.targetClass, form.targetId)) {
                context.buildConstraintViolationWithTemplate("L'identifiant de la cible n'existe pas en base.")
                    .addPropertyNode("targetId")
                    .addConstraintViolation()
                isValid = false
            }
        }

        return isValid
    }

    /**
     * Méthode utilitaire pour vérifier l'existence en base d'une entité via son compagnon Panache.
     * On se base sur une logique similaire à celle de votre ExistsInDatabaseValidator.
     */
    private fun existsInDatabase(entityClass: KClass<*>, id: Any?): Boolean {
        // Si l'id est null, on considère que la validation échoue
        if (id == null) return false

        // Récupérer le compagnon de la classe d'entité
        val companionInstance = entityClass.companionObjectInstance
        if (companionInstance !is PanacheCompanionBase<*, *>) {
            return false
        }
        // Recherche de la méthode findById par reflection
        val findByIdMethod = companionInstance::class.members.firstOrNull { it.name == "findById" }
        val result = findByIdMethod?.call(companionInstance, id)
        return result != null
    }
}

