package net.enovea.team
import io.quarkus.hibernate.orm.panache.Panache
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import jakarta.ws.rs.BadRequestException
import jakarta.ws.rs.NotFoundException
import net.enovea.workInProgress.common.ICRUDService
import net.enovea.workInProgress.common.Stat
import net.enovea.workInProgress.common.StatsDTO
import net.enovea.workInProgress.teamCRUD.TeamForm
import net.enovea.driver.DriverDTO
import net.enovea.driver.DriverMapper
import net.enovea.driver.driverTeam.DriverTeamEntity
import net.enovea.team.teamCategory.TeamCategoryDTO
import net.enovea.team.teamCategory.TeamCategoryEntity
import java.time.LocalDateTime
import net.enovea.team.teamCategory.TeamCategoryMapper
import net.enovea.vehicle.VehicleDTO
import net.enovea.vehicle.VehicleMapper
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import net.enovea.workInProgress.GenericNodeDTO
import net.enovea.workInProgress.affectationCRUD.IAffectationPanacheEntity
import org.hibernate.Hibernate
import java.sql.Timestamp
import java.time.LocalDate
import kotlin.reflect.KClass

class TeamService (
    private val teamMapper: TeamMapper,
    private val teamCategoryMapper: TeamCategoryMapper,
    private val driverMapper: DriverMapper,
    private val vehicleMapper: VehicleMapper
) : ICRUDService<TeamForm, TeamDTO, Int> {

    @Transactional
    fun getDriverTreeAtDate(dateParam: Timestamp? = null): List<GenericNodeDTO<DriverDTO>> {
        return this.buildNodeTreeAtDate(
            affectationClass = DriverTeamEntity::class,
            dateParam = dateParam,
            subjectToDto = { driver, ts ->
                driverMapper.toDto(driver, ts)
            }
        )
    }

    @Transactional
    fun getVehicleTreeAtDate(dateParam: Timestamp? = null): List<GenericNodeDTO<VehicleDTO>> {
        return this.buildNodeTreeAtDate(
            affectationClass = VehicleTeamEntity::class,
            dateParam = dateParam,
            subjectToDto = { vehicle, ts ->
                Hibernate.initialize(vehicle)
                vehicleMapper.toVehicleDTO(vehicle)
            }
        )
    }

    fun getAllTeamCategory() : List<TeamCategoryDTO>{
        val teamCategories = TeamCategoryEntity.listAll()
        return teamCategories.map {teamCategoryMapper.toDto(it)}
    }

    fun getAllAgencies(): List<TeamDTO> {
        val teams = TeamEntity.listAll()
        return teams.map { teamMapper.toDto(it) }
    }


    override fun getById(id: Int): TeamDTO {
        val existingEntity = TeamEntity.findById(id)
            ?: throw NotFoundException("Team with id=$id not found")
        return teamMapper.toDto(existingEntity)
    }

    @Transactional
    override  fun create(form: TeamForm): TeamDTO {
        // Convertir le TeamForm en entité TeamEntity via le mapper
        val newEntity = teamMapper.toEntity(form)

        // Persister l'entité
        newEntity.persistAndFlush()

        // Retourner le DTO correspondant à l'entité créée
        return teamMapper.toDto(newEntity)
    }

    @Transactional
    override fun update(form: TeamForm): TeamDTO {
        // Vérifier que l'ID est fourni
        val teamId = form.id ?: throw BadRequestException("Id not provided")

        // Récupérer l'entité existante en base
        val existingEntity = TeamEntity.findById(teamId)
            ?: throw NotFoundException("Team with id=$teamId not found")

        // Convertir le TeamForm en entité (via le mapper)
        val updatedEntity = teamMapper.toEntity(form)

        // Mettre à jour les champs de l'entité existante
        existingEntity.label      = updatedEntity.label
        existingEntity.path       = updatedEntity.path
        existingEntity.parentTeam = updatedEntity.parentTeam
        existingEntity.category   = updatedEntity.category

        // Affecter directement les chaînes de lunchBreak via les variables publiques
        existingEntity.lunchBreakStartStr = updatedEntity.lunchBreakStartStr
        existingEntity.lunchBreakEndStr   = updatedEntity.lunchBreakEndStr

        // Persister les modifications
        existingEntity.persistAndFlush()

        // Retourner le DTO mis à jour
        return teamMapper.toDto(existingEntity)
    }

    /**
     * Supprime une Team via son ID, si elle existe.
     */
    override fun delete(id: Int): TeamDTO {
        val existingEntity = TeamEntity.findById(id)
            ?: throw NotFoundException("Team with id=$id not found")

        val dtoBeforeDelete = teamMapper.toDto(existingEntity)
        existingEntity.delete()

        // On retourne le DTO de l'entité supprimée
        return dtoBeforeDelete
    }

    @Transactional
    fun getTeamCount(): Long {
        return TeamEntity.count()  // Panache
    }

    /**
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
     * Calcule les 4 stats demandées
     */
    @Transactional
    fun getTeamStats(): StatsDTO {
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

        return StatsDTO(
            date = LocalDateTime.now(),
            stats = statList
        )
    }

    @Transactional
    fun getAuthorizedData(): List<TeamDTO> {
        return TeamEntity.listAll().map { teamMapper.toDto(it) }
    }

    @Transactional
    fun <E, S, SDTO, ID: Any> buildNodeTreeAtDate(
        affectationClass: KClass<E>, dateParam: Timestamp? = null, subjectToDto: (S, Timestamp?) -> SDTO
    ): List<GenericNodeDTO<SDTO>> where E : IAffectationPanacheEntity<S, TeamEntity, ID> {
        // 1) Valeur par défaut => date courante à minuit
        val refTimestamp = dateParam ?: Timestamp.valueOf(LocalDate.now().atStartOfDay())

        // 2) Charger tous les TeamEntity en une requête
        val allTeams = TeamEntity.listAll().map { it as TeamEntity }

        // 3) Charger les entités d’affectation (ex. DriverTeamEntity ou VehicleTeamEntity) actives
        // Construire dynamiquement la requête JPQL à l'aide de l'EntityManager
        val em: EntityManager = Panache.getEntityManager()
        // Récupérer le nom de l'entité, par exemple "DriverTeamEntity" ou "VehicleTeamEntity"
        val entityName = affectationClass.simpleName
            ?: throw IllegalArgumentException("La classe ${affectationClass} n'a pas de nom simple")
        val jpql = """
         SELECT a 
         FROM $entityName a 
         WHERE a.id.startDate <= :refDate 
           AND (a.endDate IS NULL OR a.endDate >= :refDate)
    """.trimIndent()
        val query = em.createQuery(jpql, affectationClass.java)
        query.setParameter("refDate", refTimestamp)
        val activeAffectations = query.resultList as List<E>

        // 4) Construire Map<teamId, List<SDTO>>
        val teamIdToSubjects = HashMap<Int, MutableList<SDTO>>()
        for (aff in activeAffectations) {
            val teamId = aff.getTarget()?.id ?: continue
            val subject = aff.getSubject() ?: continue
            // Convertir le sujet (DriverEntity ou VehicleEntity) en SDTO via la fonction fournie
            val dto = subjectToDto(subject, refTimestamp)
            teamIdToSubjects.computeIfAbsent(teamId) { mutableListOf() }.add(dto)
        }

        // 5) Indexer les teams par leur id et repérer les racines (teams sans parent)
        val idToTeam = allTeams.associateBy { it.id }
        val rootTeams = allTeams.filter { it.parentTeam == null }

        // 6) Construire récursivement l'arbre via la méthode générique
        return rootTeams.map { convertToGenericNodeDTO(it, idToTeam, teamIdToSubjects) }
    }

    /**
     * Méthode générique pour convertir un TeamEntity en GenericNodeDTO.
     */
    private fun <SDTO> convertToGenericNodeDTO(
        team: TeamEntity, idToTeam: Map<Int, TeamEntity>, teamIdToSubjects: Map<Int, List<SDTO>>
    ): GenericNodeDTO<SDTO> {
        // Récupérer la liste des sujets associés à ce team (drivers ou vehicles)
        val subjects = teamIdToSubjects[team.id].orEmpty()
        // Mapper TeamEntity en TeamDTO à l'aide du mapper (ici, TeamMapper.INSTANCE)
        val teamDTO = teamMapper.toDto(team)
        // Trouver les sous-teams dont le parent est ce team
        val childEntities = idToTeam.values.filter { it.parentTeam?.id == team.id }
        val children = childEntities.map { convertToGenericNodeDTO(it, idToTeam, teamIdToSubjects) }
        return GenericNodeDTO(
            team = teamDTO, subjects = subjects, children = children
        )
    }

}
