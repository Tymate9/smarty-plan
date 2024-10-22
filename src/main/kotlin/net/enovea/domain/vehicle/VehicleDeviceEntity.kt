package net.enovea.domain.vehicle

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.device.DeviceEntity
import java.io.Serializable
import java.util.Date


@Entity(name = VehicleDeviceEntity.ENTITY_NAME)
@Table(name = VehicleDeviceEntity.TABLE_NAME)
data class VehicleDeviceEntity (

    @EmbeddedId
    val id: VehicleDeviceId = VehicleDeviceId(),

    @Column(name = "fitment_odometer")
    var fitmentOdometer: Int=0,

    @Column(name = "fitment_operator")
    var fitmentOperator: String?=null,

    @Column(name = "fitment_device_location")
    var fitmentDeviceLocation: String?=null,

    @Column(name = "fitment_supply_location")
    var fitmentSupplyLocation: String?=null,

    @Column(name = "fitment_supply_type")
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

    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "VehicleDeviceEntity"
        const val TABLE_NAME = "device_vehicle_install"

    }
}

@Embeddable
data class VehicleDeviceId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String="",

    @Column(name = "device_id", nullable = false)
    val deviceId: Int=0,

    @Column(name = "date", nullable = false)
    val date: Date = Date(System.currentTimeMillis())
) : Serializable