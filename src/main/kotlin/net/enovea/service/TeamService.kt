package net.enovea.service
import jakarta.ws.rs.BadRequestException
import jakarta.ws.rs.NotFoundException
import net.enovea.domain.team.TeamCategoryEntity
import net.enovea.domain.team.TeamCategoryMapper
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.team.TeamMapper
import net.enovea.dto.TeamCategoryDTO

import net.enovea.dto.TeamDTO


class TeamService (
    private val teamMapper: TeamMapper,
    private val teamCategoryMapper: TeamCategoryMapper
) {
    fun getAllTeamCategory() : List<TeamCategoryDTO>{
        val teamCategories = TeamCategoryEntity.listAll()
        return teamCategories.map {teamCategoryMapper.toDto(it)}
    }

    fun getAllAgencies(): List<TeamDTO> {
        val teams = TeamEntity.listAll()
        return teams.map { teamMapper.toDto(it) }
    }

    fun getTeamById(id: Int): TeamDTO {
        val existingEntity = TeamEntity.findById(id)
            ?: throw NotFoundException("Team with id=$id not found")
        return teamMapper.toDto(existingEntity)
    }

    /**
     * Crée une nouvelle Team en base, et retourne le DTO créé.
     */
    fun createTeam(teamDTO: TeamDTO): TeamDTO {
        val newEntity = teamMapper.toEntity(teamDTO)
        // On persiste avec Panache
        TeamEntity.persist(newEntity)
        // Retourne la version DTO (incluant l'ID généré, etc.)
        return teamMapper.toDto(newEntity)
    }

    /**
     * Met à jour une Team existante, selon l'ID contenu dans le DTO.
     * Si l'entité n'existe pas, on peut lever une exception ou retourner un DTO vide.
     */
    fun updateTeam(teamDTO: TeamDTO): TeamDTO {
        // Vérifier que l'ID est fourni
        val teamId = teamDTO.id ?: throw BadRequestException("Id not provided")

        val existingEntity = TeamEntity.findById(teamId)
            ?: throw NotFoundException("Team with id=$teamId not found")

        // Mettre à jour manuellement champ par champ
        existingEntity.label = teamDTO.label
        existingEntity.path = teamDTO.path

        // Mise à jour de la relation parentTeam
        val parentId = teamDTO.parentTeam?.id
        if (parentId != null) {
            val parentEntity = TeamEntity.findById(parentId)
                ?: throw NotFoundException("Parent Team with id=$parentId not found")
            existingEntity.parentTeam = parentEntity
        } else {
            existingEntity.parentTeam = null
        }

        // Mise à jour de la catégorie
        val categoryId = teamDTO.category.id
        val categoryEntity = TeamCategoryEntity.findById(categoryId)
            ?: throw NotFoundException("Category with id=$categoryId not found")
        existingEntity.category = categoryEntity

        // Persister les modifications
        existingEntity.persist()
        return teamMapper.toDto(existingEntity)
    }

    /**
     * Supprime une Team via son ID, si elle existe.
     */
    fun deleteTeam(id: Int) {
        val existingEntity = TeamEntity.findById(id)
            ?: throw NotFoundException("Team with id=$id not found")
        existingEntity.delete()
    }
}
