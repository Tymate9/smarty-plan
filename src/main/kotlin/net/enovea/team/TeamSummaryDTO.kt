package net.enovea.team

import net.enovea.team.teamCategory.TeamCategoryDTO

data class TeamSummaryDTO (
    var id : Int,
    var label : String,
    var path : String?,
    var category : TeamCategoryDTO
)