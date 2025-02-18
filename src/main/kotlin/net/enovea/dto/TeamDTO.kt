package net.enovea.dto

import java.time.LocalTime


data class TeamDTO (
    var id : Int,
    var label : String,
    var path : String?,
    var parentTeam : TeamDTO?,
    var category : TeamCategoryDTO,
    var lunchBreakStart: LocalTime? = null,
    var lunchBreakEnd: LocalTime? = null
)
