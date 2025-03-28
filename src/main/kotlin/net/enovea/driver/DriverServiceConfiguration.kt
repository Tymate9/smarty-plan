package net.enovea.driver

import jakarta.enterprise.inject.Produces
import jakarta.inject.Named
import jakarta.persistence.EntityManager
import net.enovea.team.TeamMapper

class DriverServiceConfiguration {
    @Produces
    @Named("driverService")
    fun driverService(
        driverMapper: DriverMapper,
        entityManager: EntityManager,
    ): DriverService {
        return DriverService(driverMapper, entityManager)
    }
}