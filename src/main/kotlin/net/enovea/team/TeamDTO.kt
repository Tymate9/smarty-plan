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
import net.enovea.team.teamCategory.TeamCategoryEntity
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObjectInstance

import java.time.LocalTime


data class TeamDTO (
    var id: Int?,
    var label: String,
    var path: String?,
    var parentTeam: TeamDTO?,
    var category: TeamCategoryDTO,
    var lunchBreakStart: LocalTime? = null,
    var lunchBreakEnd: LocalTime? = null
)