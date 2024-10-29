package net.enovea.dto


data class TeamDTO (
    var id : Int,
    var label : String,
    var path : String?,
    var parentTeam : TeamDTO?,
    var category : TeamCategoryDTO
)
