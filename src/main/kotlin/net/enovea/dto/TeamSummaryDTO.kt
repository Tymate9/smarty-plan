package net.enovea.dto

data class TeamSummaryDTO (
    var id : Int,
    var label : String,
    var path : String?,
    var category : TeamCategoryDTO
)