package net.enovea.domain.vehicle

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import jakarta.transaction.Transactional
import net.enovea.api.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import net.enovea.domain.device.DeviceEntity
import net.enovea.domain.driver.DriverEntity
import net.enovea.domain.vehicle_category.VehicleCategoryEntity

/**
 * Représente un véhicule
 **/

@Entity(name = VehicleEntity.ENTITY_NAME )
@Table(name = VehicleEntity.TABLE_NAME)

data class VehicleEntity(

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: String ?= "",

    @Column(name = "energy", nullable = true)
    var energy: String ?= null,

    @Column(name = "engine", nullable = true)
    var engine: String ?= null,

    @Column(name = "externalid", nullable = true)
    var externalId: String ?= null,

    @Column(name = "licenseplate", nullable = false)
    var licenseplate: String ="",

    @Column(name = "validated", nullable = false)
    var validated: Boolean = false,


    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "vehicle",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
        )
    val vehicleDevices: List<DeviceVehicleInstallEntity> = mutableListOf(),

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "vehicle",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
        )
    val vehicleDrivers: List<VehicleDriverEntity> = mutableListOf(),

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "vehicle",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
        )
    val vehicleTeams: List<VehicleTeamEntity> = mutableListOf(),

    @ManyToOne
    @JoinColumn(name = "category_id")
    var category: VehicleCategoryEntity? = null,


    ) : PanacheEntityBase {

    fun retrieveVehicleDrivers(): List<VehicleDriverEntity> {
        return vehicleDrivers
    }
    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "VehicleEntity"
        const val TABLE_NAME = "vehicle"

        fun getCurrentDriver(vehicleDriversList: List<VehicleDriverEntity>): DriverEntity? = vehicleDriversList.filter { it.endDate == null }.maxByOrNull { it.id.startDate }?.driver

        fun getCurrentDevice(vehicleDevicesList: List<DeviceVehicleInstallEntity>): DeviceEntity? = vehicleDevicesList.filter { it.endDate == null }.maxByOrNull { it.id.startDate }?.device

        // Method to find by ID as String
        @Transactional
        fun findByIdString(id: String): VehicleEntity? {
            return find("id = ?1", id).firstResult()
        }

        // Query to fetch vehicles with drivers
        @Transactional
        fun findAllWithDrivers(): List<VehicleEntity> {
            return find(
                query = "SELECT v FROM VehicleEntity v " +
                        "JOIN FETCH v.VehicleDriverEntity vd " +
                        "JOIN FETCH vd.DriverEntity"
            ).list()
        }
    }
}