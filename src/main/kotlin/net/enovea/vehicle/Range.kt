package net.enovea.vehicle


data class Range<T> (
    val label : String,
    val description : String,
    val range : TimestampRange,
    val transform : (T) -> T
)