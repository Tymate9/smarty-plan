package net.enovea.workInProgress.teamCRUD

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
import net.enovea.workInProgress.common.ExistsInDatabase
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