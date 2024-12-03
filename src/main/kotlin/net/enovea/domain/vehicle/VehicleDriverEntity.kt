package net.enovea.domain.vehicle
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.driver.DriverEntity
import java.io.Serializable
import java.sql.Timestamp

@Entity(name = VehicleDriverEntity.ENTITY_NAME)
@Table(name = VehicleDriverEntity.TABLE_NAME)

data class VehicleDriverEntity (

    @EmbeddedId
    val id: VehicleDriverId = VehicleDriverId(),

    //TODO(Vérifier si la nullité est ok)
    @Column(name = "end_date", nullable = true)
    val endDate: Timestamp? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("vehicleId")
    @JoinColumn(name = "vehicle_id", nullable = false)
    val vehicle: VehicleEntity? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("driverId")
    @JoinColumn(name = "driver_id", nullable = false)
    val driver: DriverEntity? = null,


): PanacheEntityBase {

    companion object : PanacheCompanionBase<VehicleDriverEntity, VehicleDriverId> {
        const val ENTITY_NAME = "VehicleDriverEntity"
        const val TABLE_NAME = "vehicle_driver"

    }
}

@Embeddable
data class VehicleDriverId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String="",

    @Column(name = "driver_id", nullable = false)
    val driverId: Int=0,

    @Column(name = "start_date", nullable = false)
    val startDate: Timestamp=Timestamp(System.currentTimeMillis())
) : Serializable