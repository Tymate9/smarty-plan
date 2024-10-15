package net.enovea.domain.device

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.api.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import net.enovea.domain.vehicle.VehicleEntity
import java.sql.Timestamp

@Entity(name = DeviceEntity.ENTITY_NAME )
@Table(name = DeviceEntity.TABLE_NAME)

data class DeviceEntity (
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    @Column(name = "imei", length = 20, nullable = true)
    var imei: String? = null,

    @Column(name = "label", nullable = true)
    var label: String? = null,

    @Column(name = "manufacturer", nullable = true)
    var manufacturer: String? = null,

    @Column(name = "model", nullable = true)
    var model: String? = null,

    @Column(name = "serialnumber", nullable = true)
    var serialNumber: String? = null,

    @Column(name = "simnumber", nullable = true)
    var simNumber: String? = null,

    @Column(name = "gateway_enabled", nullable = false)
    var gatewayEnabled: Boolean = true,

    @Column(name = "last_data_date", nullable = true)
    var lastDataDate: Timestamp? = null,

    @Column(name = "comment", nullable = true, columnDefinition = "TEXT")
    var comment: String? = null,

    @Column(name = "last_communication_date", nullable = true)
    var lastCommunicationDate: Timestamp? = null


    ): PanacheEntityBase {

    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "DeviceEntity"
        const val TABLE_NAME = "device"
        const val COLUMN_ID = "id"

    }
}
