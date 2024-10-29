package net.enovea.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import net.enovea.domain.vehicle.DriverUntrackedPeriodEntity

@ApplicationScoped
class DriverUntrackedPeriodRepository : PanacheRepository<DriverUntrackedPeriodEntity> {

    fun findDriverIdsWithUntrackedPeriod(): List<Int> {
        return findAll().list()
            .filter { it.endDate == null }
            .map { it.id.driverId }
    }
}