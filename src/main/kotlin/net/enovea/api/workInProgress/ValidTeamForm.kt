package net.enovea.api.workInProgress

import jakarta.transaction.Transactional
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import net.enovea.team.teamCategory.TeamCategoryEntity
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import kotlin.reflect.KClass

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