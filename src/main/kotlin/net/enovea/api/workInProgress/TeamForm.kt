package net.enovea.api.workInProgress

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.transaction.Transactional
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import net.enovea.team.TeamEntity
import net.enovea.team.teamCategory.TeamCategoryEntity
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObjectInstance

@ValidTeamForm
data class TeamForm (
    @field:Positive(message = "l'identifiant ne doit pas être négatif ou égal à zéro.")
    var id: Int?,

    @field:NotNull(message = "Le label ne doit pas être null.")
    @field:Size(min = 1, max = 255, message = "Le label doit comporter entre 1 et 255 caractères.")
    var label: String?,

    var path: String?,

    @NotNull(message= "La catégorie ne doit pas être null.")
    @field:Positive(message = "L'identifiant de la catégorie de groupe ne peux pas être négatif ou égale à zéro")
    @field:ExistsInDatabase(entityClass = TeamCategoryEntity::class, message = "La catégorie n'existe pas en base.")
    var category: Int?,

    @field:ExistsInDatabase(entityClass= TeamEntity::class, message = "Le groupe parent n'existe pas en base")
    var parentTeam: Int?,

    @field:Pattern(
        regexp = "^(?:(?:([01]?\\d|2[0-3]):)?([0-5]?\\d):)?([0-5]?\\d)\$",
        message = "Format d'heure invalide pour le lunchBreakStartStr. Attendu HH:mm:ss (avec tolérance heure/minute facultative)."
    )
    var lunchBreakStartStr: String?,

    @field:Pattern(
        regexp = "^(?:(?:([01]?\\d|2[0-3]):)?([0-5]?\\d):)?([0-5]?\\d)\$",
        message = "Format d'heure invalide pour le lunchBreakEndStr. Attendu HH:mm:ss (avec tolérance heure/minute facultative)."
    )
    var lunchBreakEndStr: String?

)

class ExistsInDatabaseValidator : ConstraintValidator<ExistsInDatabase, Any?> {
    private lateinit var entityClass: KClass<*>

    override fun initialize(constraintAnnotation: ExistsInDatabase) {
        entityClass = constraintAnnotation.entityClass
    }

    @Transactional
    override fun isValid(value: Any?, context: ConstraintValidatorContext): Boolean {
        // Si la valeur est nulle, considérez la validation réussie (ou ajustez selon vos besoins).
        if (value == null) return true
        // Récupérer le compagnon de la classe d'entité
        val companionInstance = entityClass.companionObjectInstance
        if (companionInstance !is PanacheCompanionBase<*, *>) {
            return false
        }
        // Utiliser la valeur directement comme identifiant
        val id = value
        // Utilisation de reflection pour appeler findById sur le compagnon
        val findByIdMethod = companionInstance::class.members.firstOrNull { it.name == "findById" }
        val result = findByIdMethod?.call(companionInstance, id)

        return result != null
    }
}

@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [ExistsInDatabaseValidator::class])
annotation class ExistsInDatabase(
    val entityClass: KClass<*>,
    val message: String = "L'entité n'existe pas en base.",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)