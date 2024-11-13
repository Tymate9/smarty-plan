package net.enovea.service

import io.quarkus.hibernate.orm.panache.Panache
import jakarta.persistence.EntityManager
import jakarta.persistence.TypedQuery
import jakarta.transaction.Transactional

class DriverService {

    @Transactional
    fun getAllDrivers(): List<String> {
        val entityManager: EntityManager = Panache.getEntityManager()

        //which ensures the result is a list of strings.
        val query: TypedQuery<String> = entityManager.createQuery(
            """
            SELECT CONCAT(d.lastName, ' ', d.firstName) 
            FROM DriverEntity d
            """.trimIndent(),
            String::class.java
        )
        return query.resultList
    }

}