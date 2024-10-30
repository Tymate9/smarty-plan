package net.enovea.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import net.enovea.domain.driver.DriverEntity


@ApplicationScoped
class DriverRepository : PanacheRepository<DriverEntity> {

    // Custom method to find drivers by full names (concatenating first name and last name)
    fun findByFullNames(fullNames: List<String>): List<DriverEntity> {
        return list("CONCAT(firstName, ' ', lastName) IN ?1", fullNames)
    }

}
