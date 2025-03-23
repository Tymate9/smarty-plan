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
import net.enovea.driver.DriverEntity
import net.enovea.driver.DriverMapper
import net.enovea.driver.driverTeam.DriverTeamEntity
import net.enovea.team.teamCategory.TeamCategoryDTO
import net.enovea.team.teamCategory.TeamCategoryEntity
import java.time.LocalDateTime
import net.enovea.team.teamCategory.TeamCategoryMapper
import net.enovea.vehicle.VehicleDTO
import net.enovea.vehicle.VehicleEntity
import net.enovea.vehicle.VehicleMapper
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import net.enovea.workInProgress.GenericNodeDTO
import net.enovea.workInProgress.affectationCRUD.IAffectationFactory
import net.enovea.workInProgress.affectationCRUD.IAffectationPanacheEntity
import org.hibernate.Hibernate
import java.sql.Timestamp
import java.time.LocalDate
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObject

class TeamService (
    private val teamMapper: TeamMapper,
    private val teamCategoryMapper: TeamCategoryMapper,
    private val driverMapper: DriverMapper,
    private val vehicleMapper: VehicleMapper
) : ICRUDService<TeamForm, TeamDTO, Int> {

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
    fun getDriverTreeAtDate(dateParam: Timestamp? = null): List<GenericNodeDTO<DriverDTO>> {
        return this.buildNodeTreeAtDate(
            affectationClass = DriverTeamEntity::class,
            subjectEntityName = DriverEntity::class.simpleName!!,
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
            subjectEntityName = VehicleEntity::class.simpleName!!,
            dateParam = dateParam,
            subjectToDto = { vehicle, ts ->
                Hibernate.initialize(vehicle)
                vehicleMapper.toVehicleDTO(vehicle)
            }
        )
    }

    @Transactional
    fun <E, S, SDTO, ID: Any> buildNodeTreeAtDate(
        affectationClass: KClass<E>,
        subjectEntityName: String,
        dateParam: Timestamp? = null,
        subjectToDto: (S, Timestamp?) -> SDTO
    ): List<GenericNodeDTO<SDTO>>
            where E : IAffectationPanacheEntity<S, TeamEntity, ID> {

        val refTimestamp = dateParam ?: Timestamp.valueOf(LocalDate.now().atStartOfDay())
        val em: EntityManager = Panache.getEntityManager()

        // 1/ Récupérer le companion object et son subjectIdPath()
        val companionObj = affectationClass.companionObject?.objectInstance
            ?: throw IllegalArgumentException("Aucune companion object trouvée pour $affectationClass")

        if (companionObj !is IAffectationFactory<*, *>) {
            throw IllegalArgumentException("Le companion object de $affectationClass n'implémente pas IAffectationFactory")
        }

        // subjectIdPath() renvoie par ex. "driver.id", "vehicle.id", etc.
        val subjectIdPath = companionObj.subjectIdPath()

        // 2/ Récupérer toutes les équipes (TeamEntity)
        val allTeams = TeamEntity.listAll().map { it as TeamEntity }

        // 3/ Récupérer les affectations actives
        val entityName = affectationClass.simpleName
            ?: throw IllegalArgumentException("La classe $affectationClass n'a pas de nom simple")

        val jpqlAffectations = """
        SELECT a
        FROM $entityName a
        WHERE a.id.startDate <= :refDate
          AND (a.endDate IS NULL OR a.endDate >= :refDate)
    """.trimIndent()

        val activeQuery = em.createQuery(jpqlAffectations, affectationClass.java)
        activeQuery.setParameter("refDate", refTimestamp)
        val activeAffectations = activeQuery.resultList as List<E>

        // 4/ Construire Map<teamId, List<SDTO>> + liste orphelins (initialement vide)
        val teamIdToSubjects = HashMap<Int, MutableList<SDTO>>()
        val unassignedSubjects = mutableListOf<SDTO>()

        // On parcourt toutes les affectations actives
        for (aff in activeAffectations) {
            val teamId = aff.getTarget()?.id
            val subject = aff.getSubject() ?: continue
            val dto = subjectToDto(subject, refTimestamp)

            if (teamId == null) {
                // => orphelin
                unassignedSubjects.add(dto)
            } else {
                teamIdToSubjects.computeIfAbsent(teamId) { mutableListOf() }.add(dto)
            }
        }

        // 5/ Requête pour obtenir les orphelins (sujets jamais affectés)
        val orphanJpql = """
        SELECT s
        FROM $subjectEntityName s
        WHERE s.id NOT IN (
            SELECT ${"a.$subjectIdPath"}
            FROM $entityName a
            WHERE a.id.startDate <= :refDate
              AND (a.endDate IS NULL OR a.endDate >= :refDate)
        )
    """.trimIndent()

        val orphanQuery = em.createQuery(orphanJpql)
        orphanQuery.setParameter("refDate", refTimestamp)
        val orphanSubjects = orphanQuery.resultList as List<S>

        // On convertit ces orphelins en DTO
        val orphanSubjectsDTO = orphanSubjects.map { s -> subjectToDto(s, refTimestamp) }
        unassignedSubjects.addAll(orphanSubjectsDTO)


        // 6/ Construire l'arbre des équipes
        val idToTeam = allTeams.associateBy { it.id }
        val rootTeams = allTeams.filter { it.parentTeam == null }

        val tree = rootTeams.map {
            convertToGenericNodeDTO(it, idToTeam, teamIdToSubjects)
        }.toMutableList()

        // 7/ Ajouter le nœud "Orphan" s'il y a des sujets non affectés
        if (unassignedSubjects.isNotEmpty()) {
            val noTeamDTO = TeamDTO(
                id = -1,
                label = "Orphan",
                category = TeamCategoryDTO(-1, "Orphan root"),
                path = null,
                parentTeam = null,
                lunchBreakStart = null,
                lunchBreakEnd = null,
            )
            val noTeamNode = GenericNodeDTO(
                team = noTeamDTO,
                subjects = unassignedSubjects,
                children = emptyList()
            )
            tree.add(noTeamNode)
        }

        return tree
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
