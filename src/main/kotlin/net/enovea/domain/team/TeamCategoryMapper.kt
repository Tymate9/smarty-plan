package net.enovea.domain.team

import net.enovea.dto.TeamCategoryDTO
import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers


@Mapper
interface TeamCategoryMapper {
    fun toDto(teamCategory : TeamCategoryEntity): TeamCategoryDTO

    fun toEntity(teamCategoryDTO : TeamCategoryDTO): TeamCategoryEntity

    companion object {
        val INSTANCE: TeamCategoryMapper = Mappers.getMapper(TeamCategoryMapper::class.java)
    }
}