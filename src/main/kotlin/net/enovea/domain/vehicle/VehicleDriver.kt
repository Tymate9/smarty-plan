package net.enovea.domain.vehicle
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.driver.DriverEntity
import java.io.Serializable
import java.sql.Timestamp




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

): PanacheEntityBase {

    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "VehicleDriver"
        const val TABLE_NAME = "vehicle_driver"

    }
}

@Embeddable
data class VehicleDriverId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String="",

    @Column(name = "driver_id", nullable = false)
    val driverId: Int=0,

    @Column(name = "date", nullable = false)
    val date: Timestamp=Timestamp(System.currentTimeMillis())
) : Serializable