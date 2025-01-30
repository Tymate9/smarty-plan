package net.enovea.team

import net.enovea.team.teamCategory.TeamCategoryDTO

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import net.enovea.domain.team.TeamCategoryEntity
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObjectInstance

import java.time.LocalTime


data class TeamDTO (
    @field:Positive(message = "ID ne doit pas être négatif ou égal à zéro.")
    var id: Int?,

    @field:NotNull(message = "Le label ne doit pas être null.")
    @Size(min = 1, max = 255, message = "Le label doit comporter entre 1 et 255 caractères.")
    var label: String,

    var path: String?,

    var parentTeam: TeamDTO?,

    @field:NotNull(message = "La catégorie ne doit pas être null.")
    @field:ExistsInDatabase(entityClass = TeamCategoryEntity::class, message = "La catégorie n'existe pas en base.")
    var category: TeamCategoryDTO,
    var lunchBreakStart: LocalTime? = null,
    var lunchBreakEnd: LocalTime? = null
)

class ExistsInDatabaseValidator : ConstraintValidator<ExistsInDatabase, Any?> {
    private lateinit var entityClass: KClass<*>

    override fun initialize(constraintAnnotation: ExistsInDatabase) {
        entityClass = constraintAnnotation.entityClass
    }

    override fun isValid(value: Any?, context: ConstraintValidatorContext): Boolean {
        if (value == null) return false

        // Récupérer le compagnon de la classe d'entité
        val companionInstance = entityClass.companionObjectInstance
        if (companionInstance !is PanacheCompanionBase<*, *>) {
            // Si le compagnon n'est pas trouvé ou n'est pas du bon type, on considère la validation comme échouée
            return false
        }

        // Essayer de récupérer une propriété "id" depuis l'objet (en supposant qu'elle est définie)
        val idProperty = value::class.members.firstOrNull { it.name == "id" }
        val id = idProperty?.call(value)
        if (id == null) return false

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