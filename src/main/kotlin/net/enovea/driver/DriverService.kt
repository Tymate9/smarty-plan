package net.enovea.driver

import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import java.sql.Timestamp
import java.time.LocalTime
import jakarta.ws.rs.BadRequestException
import jakarta.ws.rs.NotFoundException
import net.enovea.commons.Stat
import net.enovea.commons.StatsDTO
import net.enovea.team.TeamEntity
import net.enovea.team.teamCategory.TeamCategoryEntity
import net.enovea.vehicle.VehicleEntity
import net.enovea.commons.ICRUDService
import java.time.LocalDate
import java.time.LocalDateTime

class DriverService(
    private val driverMapper: DriverMapper,
    private val entityManager: EntityManager,
) : ICRUDService<DriverForm, DriverDTO, Int> {

    // Méthodes CRUD implémentées via l'interface ICRUDService

    @Transactional
    override fun getById(id: Int): DriverDTO {
        val entity = DriverEntity.findById(id) ?: throw NotFoundException("Driver not found")
        return driverMapper.toDto(entity)
    }

    @Transactional
    override fun create(form: DriverForm): DriverDTO {
        val entity = DriverEntity().apply {
            firstName = form.firstName
            lastName = form.lastName
            phoneNumber = form.phoneNumber
        }
        entity.persistAndFlush()
        return driverMapper.toDto(entity)
    }

    @Transactional
    override fun update(form: DriverForm): DriverDTO {
        val id = form.id ?: throw BadRequestException("Id not provided")
        val entity = DriverEntity.findById(id) ?: throw NotFoundException("Driver not found")
        // Mise à jour des champs
        entity.firstName = form.firstName
        entity.lastName = form.lastName
        entity.phoneNumber = form.phoneNumber
        entity.persistAndFlush()
        return driverMapper.toDto(entity)
    }

    @Transactional
    override fun delete(id: Int): DriverDTO {
        val entity = DriverEntity.findById(id) ?: throw NotFoundException("Driver not found")
        val dto = driverMapper.toDto(entity)
        val query = entityManager.createNativeQuery("DELETE FROM driver WHERE id = ?")
        query.setParameter(1, id)
        query.executeUpdate()
        return dto
    }

    @Transactional
    fun getAllDrivers(): List<DriverDTO> {
        return DriverEntity.findAll().list().map { driverMapper.toDto(it) }
    }

    @Transactional
    fun getDrivers(agencyIds: List<String>?): List<DriverDTO> {
        // 1) Définir la date de référence sous forme de LocalDate et la convertir en Timestamp à minuit.
        val today = LocalDate.now()
        val timestampParam = Timestamp.valueOf(today.atTime(LocalTime.MAX))

        // 2) On va construire la requête de base en utilisant le paramètre :theDate qui est maintenant un Timestamp
        var baseQuery = """
        SELECT d
        FROM DriverEntity d
        JOIN FETCH VehicleDriverEntity vd ON d.id = vd.id.driverId
            AND vd.id.startDate <= :theDate
            AND (vd.endDate IS NULL OR vd.endDate >= :theDate)
        JOIN FETCH VehicleEntity v ON vd.id.vehicleId = v.id
        LEFT JOIN VehicleUntrackedPeriodEntity vup 
            ON vup.id.vehicleId = v.id 
            AND vup.id.startDate <= :theDate
            AND (vup.endDate IS NULL OR vup.endDate >= :theDate)    
        LEFT JOIN DriverUntrackedPeriodEntity dup 
            ON dup.id.driverId = d.id 
            AND dup.id.startDate <= :theDate
            AND (dup.endDate IS NULL OR dup.endDate >= :theDate)
    """.trimIndent()

        // 3) Préparation des paramètres (en injectant le timestamp)
        val params = mutableMapOf<String, Any>(
            "theDate" to timestampParam
        )
        var hasWhere = false

        // 4) Si l’utilisateur fournit des agences, on joint la table DriverTeamEntity
        if (!agencyIds.isNullOrEmpty()) {
            baseQuery += """
                    
            JOIN DriverTeamEntity dt ON d.id = dt.id.driverId
                AND dt.id.startDate <= :theDate
                AND (dt.endDate IS NULL OR dt.endDate >= :theDate)
            JOIN TeamEntity t ON dt.id.teamId = t.id
            LEFT JOIN t.parentTeam parent_team
        """.trimIndent()

            // On ajoute un WHERE pour filtrer sur les agences
            baseQuery += """
                
            WHERE ( t.label IN :agencyIds
                OR (parent_team IS NOT NULL AND parent_team.label IN :agencyIds) )
        """.trimIndent()

            params["agencyIds"] = agencyIds
            hasWhere = true
        }

        // 5) Ajouter ensuite la condition pour exclure les périodes non suivies (untracked)
        val untrackedCondition = """
            
        ${if (hasWhere) "AND" else "WHERE"} 
        vup.id.startDate IS NULL
        AND dup.id.startDate IS NULL
    """.trimIndent()

        baseQuery += "\n$untrackedCondition"

        // 6) On exécute la requête Panache en utilisant la requête construite et les paramètres
        val panacheQuery = DriverEntity.find(baseQuery, params)

        // 7) On mappe les entités DriverEntity en DriverDTO
        return panacheQuery.list().map { driverMapper.toDto(it) }
    }

    // ====================================================
    // Méthodes pour récupérer la fenêtre de pause d’un Driver
    // ====================================================

    /**
     * Récupère la liste des teams actives pour un driver, à la date [refDate].
     * (endDate IS NULL ou endDate >= refDate)
     */
    @Transactional
    fun findActiveDriverTeams(driver: DriverEntity, refDate: Timestamp): List<TeamEntity> {
        return driver.driverTeams
            .filter { it.endDate == null || it.endDate!! >= refDate }
            .mapNotNull { it.team }
            .distinct()
    }

    /**
     * Remonte l’héritage pour trouver la lunchBreakStart s’il est null
     * dans la team courante.
     */
    fun findInheritedStart(team: TeamEntity?): LocalTime? {
        if (team == null) return null
        return team.lunchBreakStart ?: findInheritedStart(team.parentTeam)
    }

    /**
     * Remonte l’héritage pour trouver la lunchBreakEnd s’il est null
     * dans la team courante.
     */
    fun findInheritedEnd(team: TeamEntity?): LocalTime? {
        if (team == null) return null
        return team.lunchBreakEnd ?: findInheritedEnd(team.parentTeam)
    }

    /**
     * Calcule la fenêtre de pause pour UN driver (donc pas forcément “globale”).
     * - Récupère les teams actives du driver
     * - Applique l’héritage pour chaque team
     * - Retrouve la plage [earliestStart, latestEnd]
     */
    fun getDriverPauseWindow(driver: DriverEntity, refDate: Timestamp): Pair<LocalTime?, LocalTime?> {
        val activeTeams = findActiveDriverTeams(driver, refDate)

        val timeRanges = activeTeams.mapNotNull { team ->
            val finalStart = findInheritedStart(team)
            val finalEnd   = findInheritedEnd(team)
            if (finalStart != null && finalEnd != null) Pair(finalStart, finalEnd) else null
        }

        val earliestStart = timeRanges.minByOrNull { it.first }?.first
        val latestEnd     = timeRanges.maxByOrNull { it.second }?.second

        return Pair(earliestStart, latestEnd)
    }

    @Transactional
    fun getDriverStats(): StatsDTO {
        // 1. Récupérer la catégorie "Agency" pour identifier les agences.
        val agencyCategoryEntity = TeamCategoryEntity.find("label", "Agence").firstResult()
            ?: throw BadRequestException("Aucune catégorie 'Agency' trouvée")
        val agencyCategoryId = agencyCategoryEntity.id

        // 2. Nombre total de conducteurs
        val totalDrivers: Long = DriverEntity.count()

        // 3. Nombre total d'agences dont la catégorie correspond
        val totalAgencies: Long? = agencyCategoryId?.let { TeamEntity.count("category.id", it) }

        // 4. Calcul de la moyenne des conducteurs par agence (avec protection contre la division par zéro)
        val avgDriversPerAgency: Double = if (totalAgencies!! > 0L) {
            totalDrivers.toDouble() / totalAgencies.toDouble()
        } else {
            0.0
        }

        // 5. Nombre de véhicules non affectés
        // On considère qu'un véhicule est non affecté s'il n'existe aucune VehicleTeamEntity active (endDate IS NULL) pour ce véhicule.
        val nonAffectedVehicles: Long = VehicleEntity.find(
            "id NOT IN (SELECT vt.vehicle.id FROM VehicleTeamEntity vt WHERE vt.endDate IS NULL)"
        ).count()

        // 6. Construire la liste des statistiques
        val statsList = listOf(
            Stat(
                label = "Conducteurs moyen par agence",
                value = avgDriversPerAgency,
                description = "Nombre total de conducteurs divisé par le nombre d'agences"
            ),
            Stat(
                label = "Véhicules non affectés",
                value = nonAffectedVehicles.toDouble(),
                description = "Nombre de véhicules sans affectation active"
            )
        )

        // 7. Retourner un StatsDTO avec la date actuelle et la liste des stats
        return StatsDTO(
            date = LocalDateTime.now(),
            stats = statsList
        )
    }

}
