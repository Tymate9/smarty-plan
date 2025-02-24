package net.enovea.domain.vehicle

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.device.DeviceEntity
import java.io.Serializable
import java.sql.Timestamp
import java.time.LocalDate

@Entity(name = DeviceVehicleInstallEntity.ENTITY_NAME)
@Table(name = DeviceVehicleInstallEntity.TABLE_NAME)
data class DeviceVehicleInstallEntity (

    @EmbeddedId
    val id: DeviceVehicleInstallId = DeviceVehicleInstallId(),

    //TODO(Ajouter la nullité de cette attribut)
    @Column(name = "end_date", nullable = true)
    val endDate: Timestamp? = null,

    @Column(name = "fitment_odometer" ,nullable = true)
    var fitmentOdometer: Int?=null,

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

    companion object : PanacheCompanionBase<DeviceVehicleInstallEntity, DeviceVehicleInstallId> {
        const val ENTITY_NAME = "DeviceVehicleInstallEntity"
        const val TABLE_NAME = "device_vehicle_install"

        fun getActiveDevice(vehicleId: String, date: LocalDate): DeviceEntity? {
            // On convertit la date en Timestamp (début de journée)
            val startTimestamp = Timestamp.valueOf(date.atStartOfDay())
            // On interroge l'entité DeviceVehicleInstallEntity en filtrant sur le vehicle,
            // et en s'assurant que l'enregistrement est actif à la date (start_date <= date et (end_date est null ou >= date))
            val activeInstall = DeviceVehicleInstallEntity.find(
                "vehicle.id = ?1 and id.startDate <= ?2 and (endDate is null or endDate >= ?2)",
                vehicleId, startTimestamp
            ).firstResult()

            println("getActiveDevice: For vehicleId=$vehicleId at date=$date, active device found: ${activeInstall?.device?.id}")
            return activeInstall?.device
        }

    }
}

@Embeddable
data class DeviceVehicleInstallId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String="",

    @Column(name = "device_id", nullable = false)
    val deviceId: Int=0,

    @Column(name = "start_date", nullable = false)
    val startDate: Timestamp = Timestamp(System.currentTimeMillis()),
) : Serializable