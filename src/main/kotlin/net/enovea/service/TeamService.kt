package net.enovea.service
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.team.TeamMapper

import net.enovea.dto.TeamDTO


class TeamService (
    private val teamMapper: TeamMapper,
) {


    fun getAllAgencies(): List<TeamDTO> {
        val teams = TeamEntity.listAll()
        return teams.map { teamMapper.toDto(it) }
    }

}
