package net.enovea.service

import io.quarkus.hibernate.orm.panache.Panache
import jakarta.persistence.EntityManager
import jakarta.persistence.TypedQuery
import jakarta.transaction.Transactional

class DriverService {


    @Transactional
    fun getDrivers(agencyIds: List<String>?): List<String> {
        val entityManager: EntityManager = Panache.getEntityManager()

        // Start the query
        val baseQuery = """
        SELECT CONCAT(d.lastName, ' ', d.firstName)
        FROM DriverEntity d
    """

        // Extend the query only if agencyIds are provided
        val finalQuery = if (!agencyIds.isNullOrEmpty()) {
            baseQuery + """
            JOIN DriverTeamEntity dt ON d.id = dt.id.driverId
            JOIN TeamEntity t ON dt.id.teamId = t.id
            WHERE dt.endDate IS NULL AND t.label IN :agencyIds
        """
        } else {
            baseQuery
        }


        // Create the TypedQuery for a list of Strings
        val typedQuery: TypedQuery<String> = entityManager.createQuery(finalQuery, String::class.java)


        // Set the parameter for agency IDs if provided
        if (!agencyIds.isNullOrEmpty()) {
            typedQuery.setParameter("agencyIds", agencyIds)
        }

        // Execute the query and return the list of names
        return typedQuery.resultList
    }
//    @Transactional
//    fun getAllDrivers(): List<String> {
//        val entityManager: EntityManager = Panache.getEntityManager()
//
//        //which ensures the result is a list of strings.
//        val query: TypedQuery<String> = entityManager.createQuery(
//            """
//            SELECT CONCAT(d.lastName, ' ', d.firstName)
//            FROM DriverEntity d
//            """.trimIndent(),
//            String::class.java
//        )
//        return query.resultList
//    }
//
//    @Transactional
//    fun getDriversByAgencies(agencyIds: List<String>): List<String> {
//        val entityManager: EntityManager = Panache.getEntityManager()
//
//
//        val query: TypedQuery<String> = entityManager.createQuery(
//            """
//        SELECT CONCAT(d.lastName, ' ', d.firstName)
//        FROM DriverEntity d
//        JOIN  FETCH DriverTeamEntity dt ON d.id = dt.id.driverId
//        JOIN  FETCH TeamEntity t ON dt.id.teamId = t.id
//        WHERE dt.endDate IS NULL
//        AND t.label IN :agencyIds
//        """.trimIndent(),
//            String::class.java
//        )
//        // Set the parameter for agency IDs
//        query.setParameter("agencyIds", agencyIds)
//
//        return query.resultList
//    }








}