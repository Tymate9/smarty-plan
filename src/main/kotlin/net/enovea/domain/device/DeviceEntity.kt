package net.enovea.domain.device

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.api.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.impl.CoordinateArraySequence
import java.sql.Timestamp

@Entity(name = DeviceEntity.ENTITY_NAME )
@Table(name = DeviceEntity.TABLE_NAME)
data class DeviceEntity (
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    @Column(name = "imei", length = 20, nullable = false)
    var imei: String = "",

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

    @Column(name = "comment", nullable = true, columnDefinition = "TEXT")
    var comment: String? = null,


    @Column(name = "enabled", nullable = false)
    var enabled: Boolean? = true,

    //TODO(Voir si on ne peux utiliser un objet par défaut)
    @OneToOne(
        fetch = FetchType.LAZY,
        mappedBy = "device",
        cascade = [CascadeType.ALL],
        orphanRemoval = true
    )
    var deviceDataState: DeviceDataStateEntity? = null

    ): PanacheEntityBase {

    companion object : PanacheCompanionBase<DeviceEntity, Int> {
        const val ENTITY_NAME = "DeviceEntity"
        const val TABLE_NAME = "device"

    }
}
