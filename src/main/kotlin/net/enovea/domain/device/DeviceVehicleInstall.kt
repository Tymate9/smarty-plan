package net.enovea.domain.device

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.vehicle.VehicleEntity
import java.sql.Timestamp
import java.io.Serializable

@Entity(name= DeviceVehicleInstall.ENTITY_NAME)
@Table(name= DeviceVehicleInstall.TABLE_NAME)


data class DeviceVehicleInstall(

    @EmbeddedId
    val id: DeviceVehicleInstallId = DeviceVehicleInstallId(),

    @Column(name = "end_date", nullable = true)
    val endDate: Timestamp=Timestamp(System.currentTimeMillis()),

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
    val device: DeviceEntity? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    val vehicle: VehicleEntity? = null
): PanacheEntityBase {

    companion object : PanacheCompanionBase<DeviceVehicleInstall, DeviceVehicleInstallId> {
        const val ENTITY_NAME = "DeviceVehicleInstall"
        const val TABLE_NAME = "device_vehicle_install"

    }
}

@Embeddable
data class DeviceVehicleInstallId(
    @Column(name = "device_id", nullable = false)
    val deviceId: Int = 0,
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: Int = 0,
    @Column(name = "start_date", nullable = false)
    val startDate: Timestamp = Timestamp(System.currentTimeMillis())
) : Serializable

