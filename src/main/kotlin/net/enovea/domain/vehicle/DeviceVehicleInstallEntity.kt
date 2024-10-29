package net.enovea.domain.vehicle

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.device.DeviceEntity
import java.io.Serializable
import java.sql.Timestamp

@Entity(name = DeviceVehicleInstallEntity.ENTITY_NAME)
@Table(name = DeviceVehicleInstallEntity.TABLE_NAME)
data class DeviceVehicleInstallEntity (

    @EmbeddedId
    val id: VehicleDeviceId = VehicleDeviceId(),

    @Column(name = "end_date", nullable = true)
    val endDate: Timestamp = Timestamp(System.currentTimeMillis()),

    @Column(name = "fitment_odometer" ,nullable = true)
    var fitmentOdometer: Int=0,

    @Column(name = "fitment_operator",nullable = true)
    var fitmentOperator: String?=null,

    @Column(name = "fitment_device_location",nullable = true)
    var fitmentDeviceLocation: String?=null,

    @Column(name = "fitment_supply_location",nullable = true)
    var fitmentSupplyLocation: String?=null,

    @Column(name = "fitment_supply_type",nullable = true)
    var fitmentSupplyType: String?=null,


    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("vehicleId")
    @JoinColumn(name = "vehicle_id", nullable = false)
    val vehicle: VehicleEntity? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("deviceId")
    @JoinColumn(name = "device_id", nullable = false)
    val device: DeviceEntity? = null,

    ): PanacheEntityBase {

    companion object : PanacheCompanionBase<DeviceVehicleInstallEntity, VehicleDeviceId> {
        const val ENTITY_NAME = "DeviceVehicleInstallEntity"
        const val TABLE_NAME = "device_vehicle_install"

    }
}

@Embeddable
data class VehicleDeviceId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String="",

    @Column(name = "device_id", nullable = false)
    val deviceId: Int=0,

    @Column(name = "start_date", nullable = false)
    val startDate: Timestamp = Timestamp(System.currentTimeMillis()),
) : Serializable