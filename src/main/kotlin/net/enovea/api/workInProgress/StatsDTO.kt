package net.enovea.api.workInProgress

import java.time.LocalDateTime

data class StatsDTO(
    val date: LocalDateTime,
    val stats: List<Stat>
)