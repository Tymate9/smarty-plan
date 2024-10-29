package net.enovea.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import net.enovea.domain.vehicle.VehicleUntrackedPeriodEntity

@ApplicationScoped
class VehicleUntrackedPeriodRepository : PanacheRepository<VehicleUntrackedPeriodEntity> {

    fun findVehicleIdsWithUntrackedPeriod(): List<String> {
        return findAll().list()
            .filter { it.endDate == null }
            .map { it.id.vehicleId }
    }
}