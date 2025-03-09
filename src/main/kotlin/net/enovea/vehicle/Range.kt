package net.enovea.dto

import net.enovea.domain.vehicle.TimestampRange

data class Range<T> (
    val label : String,
    val description : String,
    val range : TimestampRange,
    val transform : (T) -> T
)