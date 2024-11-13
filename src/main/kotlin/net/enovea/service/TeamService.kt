package net.enovea.service

import io.quarkus.hibernate.orm.panache.Panache
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional

class TeamService {

//    //function returns all teams (summaries)
//    fun getAllAgencies(): List<String> {
//        return TeamEntity.getAgencies()
//    }

    @Transactional
    fun getAllAgencies(categoryLabel: String = "Service"): List<String> {
        val entityManager: EntityManager = Panache.getEntityManager()
        val query = entityManager.createQuery(
            """
            SELECT t.label 
            FROM TeamEntity t
            JOIN t.category c 
            WHERE c.label = :categoryLabel
            """.trimIndent(),
            String::class.java
        )
        query.setParameter("categoryLabel", categoryLabel)
        return query.resultList
    }

}
