package net.enovea.workInProgress.common

import java.time.LocalDateTime

data class StatsDTO(
    val date: LocalDateTime,
    val stats: List<Stat>
)