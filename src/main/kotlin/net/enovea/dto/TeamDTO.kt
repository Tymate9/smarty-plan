package net.enovea.dto

import net.bytebuddy.jar.asm.Label

data class TeamDTO (
    var id : Int,
    var label : String,
    var path : String,
    var parent_id : Int,
    var category_id : Int
)
