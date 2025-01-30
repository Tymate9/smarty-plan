package net.enovea.service
import jakarta.transaction.Transactional
import jakarta.ws.rs.BadRequestException
import jakarta.ws.rs.NotFoundException
import net.enovea.api.workInProgress.Stat
import net.enovea.api.workInProgress.TeamEntityStatsDTO
import net.enovea.domain.team.TeamCategoryEntity
import net.enovea.domain.team.TeamCategoryMapper
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.team.TeamMapper
import net.enovea.dto.TeamCategoryDTO

import net.enovea.dto.TeamDTO
import net.enovea.api.workInProgress.TeamForm
import java.time.LocalDateTime


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
    fun createTeam(teamForm: TeamForm): TeamDTO {
        // Convertir le TeamForm en entité TeamEntity à l'aide du mapper
        val newEntity = TeamMapper.INSTANCE.toEntity(teamForm)

        // Persister et forcer la synchronisation pour obtenir le nouvel ID
        newEntity.persistAndFlush()

        // Retourner le DTO correspondant à l'entité créée, maintenant avec le nouvel ID
        return teamMapper.toDto(newEntity)
    }

    /**
     * Met à jour une Team existante, selon l'ID contenu dans le DTO.
     * Si l'entité n'existe pas, on peut lever une exception ou retourner un DTO vide.
     */
    fun updateTeam(teamForm: TeamForm): TeamDTO {
        // Vérifier que l'ID est fourni dans le formulaire
        val teamId = teamForm.id ?: throw BadRequestException("Id not provided")

        // Récupérer l'entité existante en base
        val existingEntity = TeamEntity.findById(teamId)
            ?: throw NotFoundException("Team with id=$teamId not found")

        // Convertir le TeamForm en une nouvelle instance d'entité
        val updatedEntity = TeamMapper.INSTANCE.toEntity(teamForm)

        // Mettre à jour les champs de l'entité existante avec les valeurs du formulaire
        existingEntity.label = updatedEntity.label
        existingEntity.path = updatedEntity.path
        existingEntity.parentTeam = updatedEntity.parentTeam
        existingEntity.category = updatedEntity.category

        // Persister les modifications
        existingEntity.persistAndFlush()

        // Retourner le DTO mis à jour
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

    @Transactional
    fun getTeamCount(): Long {
        return TeamEntity.count()  // Panache
    }

    /**
     * Calcule les 4 stats demandées
     */
    @Transactional
    fun getTeamStats(): TeamEntityStatsDTO {
        val agencyCategoryId = TeamCategoryEntity.find("label", "Agence").firstResult()?.id ?: throw BadRequestException("Agency not found")

        // A) Nombre total d’agences (via categoryId = 1)
        val totalAgencies = TeamEntity.countAgencies(agencyCategoryId)

        // B) Nombre total d’équipes
        val totalTeams = TeamEntity.count()

        // C) Nombre moyen d’équipes par agence => double
        val avgTeams = TeamEntity.averageTeamsPerAgency(agencyCategoryId)

        // D) Nombre d’agences sans équipe
        val agenciesWithoutTeam = TeamEntity.countAgenciesWithoutTeam(agencyCategoryId)

        val statList = listOf(
            Stat(
                label = "Nombre total d'agences",
                value = totalAgencies.toDouble(),
                description = "Compagnon: countAgencies"
            ),
            Stat(
                label = "Nombre total d'équipes",
                value = totalTeams.toDouble(),
                description = "Compagnon: countAllTeams"
            ),
            Stat(
                label = "Nombre moyen d'équipes par agence",
                value = avgTeams,
                description = "Compagnon: averageTeamsPerAgency"
            ),
            Stat(
                label = "Nombre d'agences sans équipe",
                value = agenciesWithoutTeam.toDouble(),
                description = "Compagnon: countAgenciesWithoutTeam"
            )
        )

        return TeamEntityStatsDTO(
            date = LocalDateTime.now(),
            stats = statList
        )
    }

    @Transactional
    fun getAuthorizedData(): List<TeamDTO> {
        return TeamEntity.listAll().map { teamMapper.toDto(it) }
    }

}
