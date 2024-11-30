package net.enovea.domain.device

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.impl.CoordinateArraySequence
import java.sql.Timestamp


@Entity(name = DeviceDataStateEntity.ENTITY_NAME )
@Table(name = DeviceDataStateEntity.TABLE_NAME)
data class DeviceDataStateEntity (
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "device_data_state_seq")
    @SequenceGenerator(name = "device_data_state_seq", sequenceName = "device_data_state_seq", allocationSize = 1)
    @Column(name = "device_id")
    var deviceId: Int = -1,

    @Column(name = "state", length = 128, nullable = true)
    var state: String? = null,

    @Column(name = "first_comm_time", nullable = true)
    var firstCommTime: Timestamp? = null,

    @Column(name = "last_comm_time", nullable = true)
    var lastCommTime: Timestamp? = null,

    @Column(name = "last_received_data_time", nullable = true)
    var lastReceivedDataTime: Timestamp? = null,


    @Column(name = "last_position")
    //TODO(Modifier ça par coordonné)
    var lastPosition: Point? = Point(
        CoordinateArraySequence(arrayOf(Coordinate(0.0, 0.0))),
        GeometryFactory()
    ),

    @Column(name = "last_position_time", nullable = true)
    var lastPositionTime: Timestamp? = null,


    @OneToOne
    @JoinColumn(name = "device_id", referencedColumnName = "id", nullable = false)
    var device: DeviceEntity? = null

) : PanacheEntityBase {

    companion object : PanacheCompanionBase<DeviceDataStateEntity, Int> {
        const val ENTITY_NAME = "DeviceDataStateEntity"
        const val TABLE_NAME = "device_data_state"

    }
}