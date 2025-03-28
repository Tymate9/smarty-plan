package net.enovea.commons

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.transaction.Transactional
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObjectInstance

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