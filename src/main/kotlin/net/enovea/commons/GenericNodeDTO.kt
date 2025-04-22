package net.enovea.commons

import net.enovea.team.TeamDTO

data class GenericNodeDTO<SDTO>(
    val team: TeamDTO,
    val subjects: List<SDTO>,
    val children: List<GenericNodeDTO<SDTO>>
)