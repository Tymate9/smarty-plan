package net.enovea.commons

import java.time.LocalDateTime

data class StatsDTO(
    val date: LocalDateTime,
    val stats: List<Stat>
)