package net.enovea.team


import net.enovea.workInProgress.teamCRUD.TeamForm
import net.enovea.team.teamCategory.TeamCategoryEntity
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named

@Mapper(componentModel = "cdi")
interface TeamMapper {
    // Map from TeamEntity to TeamDTO
    fun toDto(team: TeamEntity): TeamDTO

    // Map from TeamForm
    @Mapping(target = "parentTeam", source = "parentTeam", qualifiedByName = ["mapParentTeam"])
    @Mapping(target = "category", source = "category", qualifiedByName = ["mapCategory"])
    fun toEntity(teamForm: TeamForm): TeamEntity

    // Map from TeamDTO to TeamEntity
    fun toEntity(teamDTO: TeamDTO): TeamEntity

    @Named("mapParentTeam")
    fun mapParentTeam(parentTeamId: Int?): TeamEntity? {
        // Si l'ID du parent est null, retourne null
        if (parentTeamId == null) return null
        return TeamEntity.findById(parentTeamId)
    }

    @Named("mapCategory")
    fun mapCategory(categoryId: Int): TeamCategoryEntity? {
        return TeamCategoryEntity.findById(categoryId)
    }
}