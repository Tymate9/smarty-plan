package net.enovea.affectation

import java.sql.Timestamp

data class AffectationDTO<S, T>(
    val id: String,
    val startDate: Timestamp,
    val endDate: Timestamp? = null,
    val subject: S,
    val target: T,
    val affectationType: AffectationType<*, *, *, *>
)