package net.enovea.domain.team

import net.enovea.dto.TeamDTO
import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers

@Mapper(componentModel = "cdi")
interface TeamMapper {
    // Map from TeamEntity to TeamDTO
    fun toDto(team: TeamEntity): TeamDTO

    // Map from TeamDTO to TeamEntity
    fun toEntity(teamDTO: TeamDTO): TeamEntity
}