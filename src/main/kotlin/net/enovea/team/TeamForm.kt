package net.enovea.team

import jakarta.transaction.Transactional
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import net.enovea.team.teamCategory.TeamCategoryEntity
import net.enovea.commons.ExistsInDatabase
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import kotlin.reflect.KClass

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


@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [TeamFormValidator::class])
annotation class ValidTeamForm(
    val message: String = "TeamForm invalide.",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class TeamFormValidator : ConstraintValidator<ValidTeamForm, TeamForm> {

    override fun initialize(constraintAnnotation: ValidTeamForm) {
        // Pas d'initialisation spécifique ici
    }

    @Transactional
    override fun isValid(teamForm: TeamForm, context: ConstraintValidatorContext): Boolean {
        var isValid = true

        // 1) Si category != null, on va chercher le label en base
        //    pour voir si c'est "Agence". Dans ce cas, parentTeam doit être null.
        if (teamForm.category != null) {
            val categoryEntity = TeamCategoryEntity.findById(teamForm.category!!)
            if (categoryEntity != null && categoryEntity.label.equals("Agence", ignoreCase = true)) {
                if (teamForm.parentTeam != null) {
                    context.disableDefaultConstraintViolation()
                    context.buildConstraintViolationWithTemplate(
                        "Si la catégorie est 'Agence', parentTeam doit être null."
                    )
                        .addPropertyNode("parentTeam")
                        .addConstraintViolation()
                    isValid = false
                }
            }
        }

        // 2) Vérifier que lunchBreakStartStr < lunchBreakEndStr (si pas null)
        val startStr = teamForm.lunchBreakStartStr
        val endStr = teamForm.lunchBreakEndStr
        if (!startStr.isNullOrBlank() && !endStr.isNullOrBlank()) {
            try {
                // Choix du format
                val formatter = DateTimeFormatter.ofPattern("HH:mm:ss")
                val startTime = LocalTime.parse(completeTime(startStr), formatter)
                val endTime = LocalTime.parse(completeTime(endStr), formatter)

                if (!startTime.isBefore(endTime)) {
                    context.disableDefaultConstraintViolation()
                    context.buildConstraintViolationWithTemplate(
                        "lunchBreakStartStr doit précéder lunchBreakEndStr."
                    )
                        .addPropertyNode("lunchBreakEndStr")
                        .addConstraintViolation()
                    isValid = false
                }
            } catch (e: DateTimeParseException) {
                // S'il y a une erreur de parsing, c'est normalement déjà couvert par @Pattern
                // TODO(Ajouter un petit log ici)
            }
        }

        return isValid
    }

    /**
     * Méthode d’aide pour uniformiser le format si l’utilisateur n’a fourni
     * que "mm:ss" au lieu de "HH:mm:ss". Par exemple, on peut décider de préfixer "00:"
     * si on n’a que "mm:ss", etc. Tout dépend du besoin exact.
     * Ici, c’est purement optionnel selon ta logique.
     */
    private fun completeTime(timeStr: String): String {
        val parts = timeStr.split(":")
        return when (parts.size) {
            1 -> "00:00:$timeStr"     // Juste les secondes ?
            2 -> "00:$timeStr"        // mm:ss
            else -> timeStr           // HH:mm:ss
        }
    }
}