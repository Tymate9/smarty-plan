package net.enovea.domain.vehicle.vehicle_driver
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.driver.DriverEntity
import net.enovea.domain.vehicle.VehicleEntity
import java.io.Serializable
import java.sql.Timestamp

@Embeddable
data class VehicleDriverId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String="",

    @Column(name = "driver_id", nullable = false)
    val driverId: Int=0,

    @Column(name = "date", nullable = false)
    val date: Timestamp=Timestamp(System.currentTimeMillis())
) : Serializable // Must be serializable for composite keys


@Entity(name = VehicleDriver.ENTITY_NAME)
@Table(name = VehicleDriver.TABLE_NAME)

data class VehicleDriver (

    @EmbeddedId
    val id: VehicleDriverId = VehicleDriverId(),

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("vehicleId")  // Maps the vehicleId field from VehicleServiceId to Vehicle
    @JoinColumn(name = "vehicle_id", nullable = false)
    val vehicle: VehicleEntity? = null,  // Many-to-one relationship with Vehicle

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("driverId")  // Maps the serviceId field from VehicleServiceId to Service
    @JoinColumn(name = "driver_id", nullable = false)
    val driver: DriverEntity? = null,  // Many-to-one relationship with Service

//    @Column(name = "date", nullable = false)
//    var date: Timestamp = Timestamp(System.currentTimeMillis())  // Date when the service was done

): PanacheEntityBase {

    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "VehicleDriver"
        const val TABLE_NAME = "vehicle_driver"

    }
}
