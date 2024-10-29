package net.enovea.dto

data class TeamDTOsummary (
    var id : Int,
    var label : String,
    var path : String?,
    var category : TeamCategoryDTO
)