package net.enovea.service

import io.quarkus.hibernate.orm.panache.Panache
import jakarta.persistence.EntityManager
import jakarta.persistence.TypedQuery
import jakarta.transaction.Transactional
import net.enovea.domain.driver.DriverEntity
import net.enovea.domain.driver.DriverMapper
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.team.TeamMapper
import net.enovea.domain.vehicle.VehicleEntity
import net.enovea.dto.DriverDTO
import net.enovea.dto.TeamDTO

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


}