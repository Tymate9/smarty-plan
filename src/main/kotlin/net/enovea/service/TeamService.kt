package net.enovea.service

import io.quarkus.hibernate.orm.panache.Panache
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.team.TeamMapper
import net.enovea.domain.vehicle.VehicleEntity
import net.enovea.domain.vehicle.VehicleMapper
import net.enovea.dto.TeamDTO
import net.enovea.dto.VehicleDTO

class TeamService (
    private val teamMapper: TeamMapper,
) {

//    @Transactional
//    fun getAllAgencies(categoryLabel: String = "Service"): List<String> {
//        val entityManager: EntityManager = Panache.getEntityManager()
//        val query = entityManager.createQuery(
//            """
//            SELECT t.label
//            FROM TeamEntity t
//            JOIN t.category c
//            WHERE c.label = :categoryLabel
//            """.trimIndent(),
//            String::class.java
//        )
//        query.setParameter("categoryLabel", categoryLabel)
//        return query.resultList
//    }



    fun getAllAgencies(): List<TeamDTO> {
        val teams = TeamEntity.listAll()
        return teams.map { teamMapper.toDto(it) }
    }

}
