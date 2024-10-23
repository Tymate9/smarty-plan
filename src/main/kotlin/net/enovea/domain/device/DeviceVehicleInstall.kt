package net.enovea.domain.device


import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.vehicle.VehicleEntity
import java.sql.Timestamp
import java.io.Serializable

@Entity(name= DeviceVehicleInstall.ENTITY_NAME)
@Table(name= DeviceVehicleInstall.TABLE_NAME)
@IdClass(DeviceVehicleInstallId::class)  // Composite primary key class

data class DeviceVehicleInstall(
    @Id
    @Column(name = "device_id", nullable = false)
    val deviceId: Int ?=null,

    @Id
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: Int ?=null,

    @Id
    @Column(name = "date", nullable = false)
    val date: Timestamp=Timestamp(System.currentTimeMillis()),

    @Column(name = "fitment_odometer", nullable = true)
    var fitmentOdometer: Int? = null,

    @Column(name = "fitment_operator", nullable = true)
    var fitmentOperator: String? = null,

    @Column(name = "fitment_device_location", nullable = true)
    var fitmentDeviceLocation: String? = null,

    @Column(name = "fitment_supply_location", nullable = true)
    var fitmentSupplyLocation: String? = null,

    @Column(name = "fitment_supply_type", nullable = true)
    var fitmentSupplyType: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", insertable = false, updatable = false)
    val device: DeviceEntity? = null,  // Device entity relationship

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    val vehicle: VehicleEntity? = null  // Vehicle entity relationship
): PanacheEntityBase {

    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "DeviceVehicleInstall"
        const val TABLE_NAME = "device_vehicle_install"

    }
}

data class DeviceVehicleInstallId(
    val deviceId: Int = 0,
    val vehicleId: Int = 0,
    val date: Timestamp = Timestamp(System.currentTimeMillis())
) : Serializable

