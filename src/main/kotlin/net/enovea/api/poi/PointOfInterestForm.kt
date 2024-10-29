package net.enovea.api.poi

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class PointOfInterestForm(
    @field:NotBlank
    var label : String,

    @field:NotNull
    var type : Int,

    @field:NotBlank
    var WKTPoint : String,

    @field:NotNull
    var radius : Int
)
