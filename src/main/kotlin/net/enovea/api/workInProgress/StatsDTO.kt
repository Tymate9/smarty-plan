package net.enovea.api.workInProgress

import java.time.LocalDateTime

data class TeamEntityStatsDTO(
    val date: LocalDateTime,
    val stats: List<Stat>
)