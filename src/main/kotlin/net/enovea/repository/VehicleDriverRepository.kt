package net.enovea.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import net.enovea.domain.vehicle.VehicleDriverEntity

@ApplicationScoped
class VehicleDriverRepository : PanacheRepository<VehicleDriverEntity> {

    // Custom method to find the latest VehicleDriverEntity by vehicleId
    fun findLatestDriverByVehicle(vehicleId: String): VehicleDriverEntity? {
        // Use a query that sorts by date descending and limits the result to 1
        return find("SELECT vd FROM VehicleDriverEntity vd " +
                            "WHERE vd.vehicle.id = ?1 " +
                            "ORDER BY vd.id.date DESC" , vehicleId)
            .firstResult()
    }

    fun findVehicle(): VehicleDriverEntity? {
        // Use a query that sorts by date descending and limits the result to 1
        return find("SELECT vd FROM VehicleDriverEntity vd ")
            .firstResult()
    }
}
