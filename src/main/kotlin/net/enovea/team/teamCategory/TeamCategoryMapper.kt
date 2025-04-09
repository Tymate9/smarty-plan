package net.enovea.team.teamCategory

import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers


@Mapper(componentModel = "cdi")
interface TeamCategoryMapper {
    fun toDto(teamCategory : TeamCategoryEntity): TeamCategoryDTO

    fun toEntity(teamCategoryDTO : TeamCategoryDTO): TeamCategoryEntity

}