package net.enovea.repository


import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import net.enovea.domain.vehicle.VehicleEntity


@ApplicationScoped
class VehicleRepository : PanacheRepository<VehicleEntity> {

    // Method to find by ID as String
    fun findByIdString(id: String): VehicleEntity? {
        return find("id = ?1", id).firstResult()
    }

    // Query to fetch vehicles with drivers
    fun findAllWithDrivers(): List<VehicleEntity> {
        return find(query = "SELECT v FROM VehicleEntity v " +
                "JOIN FETCH v.VehicleDriverEntity vd" +
                "JOIN FETCH vd.DriverEntity").list()
    }

}
