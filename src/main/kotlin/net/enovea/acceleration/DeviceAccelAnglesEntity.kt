package net.enovea.acceleration

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.device.DeviceEntity
import org.hibernate.annotations.JdbcType
import org.hibernate.dialect.PostgreSQLEnumJdbcType
import java.io.Serializable
import java.time.LocalDateTime

@Entity(name = DeviceAccelAnglesEntity.ENTITY_NAME)
@Table(name = DeviceAccelAnglesEntity.TABLE_NAME)
data class DeviceAccelAnglesEntity(
    @EmbeddedId
    var id: DeviceAccelAnglesId = DeviceAccelAnglesId(),

    @Column(name= "phi", nullable = true)
    var phi: Double? = null,

    @Column(name= "theta", nullable = true)
    var theta: Double? = null,

    @Column(name= "psi", nullable = true)
    var psi: Double? = null,

    @Column(name = "status", nullable = false)
    @JdbcType(PostgreSQLEnumJdbcType::class)
    var status: DeviceAccelAnglesStatus = DeviceAccelAnglesStatus.NOT_COMPUTED,

    @Column(name = "computation_time", nullable = false)
    var computationTime: LocalDateTime = LocalDateTime.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("deviceId")
    @JoinColumn(name = "device_id", referencedColumnName = "id", nullable = false)
    val device: DeviceEntity? = null
) : PanacheEntityBase {
    companion object : PanacheCompanionBase<DeviceAccelAnglesEntity, DeviceAccelAnglesId> {
        const val ENTITY_NAME = "DeviceAccelAnglesEntity"
        const val TABLE_NAME = "device_accel_angles"
    }
}

@Embeddable
data class DeviceAccelAnglesId(
    @Column(name = "device_id", nullable = false)
    val deviceId: Int=-1,

    @Column(name = "begin_date", nullable = false)
    val beginDate: LocalDateTime = LocalDateTime.now()
) : Serializable

enum class DeviceAccelAnglesStatus{
    NOT_COMPUTED,
    COMPUTED,
    NO_DATA,
    NOT_ENOUGH_DATA,
    VALIDATION_FAILED,
    MANUAL
}