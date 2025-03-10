package net.enovea.driver

import jakarta.transaction.Transactional
import net.enovea.team.TeamEntity
import java.sql.Timestamp
import java.time.LocalTime

class DriverService(
    private val driverMapper: DriverMapper,
) {


    @Transactional
    fun getDrivers(agencyIds: List<String>?): List<DriverDTO> {

        val params = mutableMapOf<String, Any>()


        var baseQuery = """
        SELECT d
        FROM DriverEntity d
        JOIN FETCH VehicleDriverEntity vd ON d.id = vd.id.driverId
        JOIN FETCH VehicleEntity v ON vd.id.vehicleId = v.id
        LEFT JOIN VehicleUntrackedPeriodEntity vup 
            ON vup.id.vehicleId = v.id 
            AND vup.id.startDate <= current_date()
            AND (vup.endDate IS NULL OR vup.endDate >= current_date())    
        LEFT JOIN DriverUntrackedPeriodEntity dup 
            ON dup.id.driverId = d.id 
            AND dup.id.startDate <= current_date() 
            AND (dup.endDate IS NULL OR dup.endDate >= current_date()) 
    """

        // Extend the query only if agencyIds are provided
        if (!agencyIds.isNullOrEmpty()) {
            baseQuery += """
            JOIN DriverTeamEntity dt ON d.id = dt.id.driverId
            JOIN TeamEntity t ON dt.id.teamId = t.id
            LEFT JOIN t.parentTeam parent_team
            WHERE dt.endDate IS NULL 
            AND (t.label IN :agencyIds OR (parent_team IS NOT NULL AND parent_team.label IN :agencyIds))
        """
            params["agencyIds"] = agencyIds

        }

        baseQuery += """
            ${if (baseQuery.contains("WHERE")) "AND" else "WHERE"} vd.endDate IS NULL
            AND vup.id.startDate IS NULL
            AND dup.id.startDate IS NULL
        """

        val panacheQuery = DriverEntity.find(baseQuery, params)

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


}