package net.enovea.domain.driver
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.api.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import net.enovea.domain.vehicle.VehicleEntity
import net.enovea.domain.vehicle.vehicle_driver.VehicleDriver


@Entity(name = DriverEntity.ENTITY_NAME )
@Table(name = DriverEntity.TABLE_NAME)
data class DriverEntity(

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    @Column(name = "first_name", nullable = false)
    var firstName: String ="",

    @Column(name = "last_name", nullable = false)
    var lastName: String ="",

    @Column(name = "phone_number", nullable = true, length = 10)
    var phoneNumber: String? = null,  // Optional, can be null

    @Column(name = "allows_localization", nullable = false)
    var allowsLocalization: Boolean = true, // Default value is true


    @OneToMany(
    fetch = FetchType.LAZY,
    mappedBy = "driver",
    cascade = [CascadeType.ALL, CascadeType.REMOVE]
    )
    val vehicleDrivers: List<VehicleDriver> = mutableListOf()  // One service can be associated with many vehicles


) : PanacheEntityBase {

    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "DriverEntity"
        const val TABLE_NAME = "driver"
        const val COLUMN_ID = "id"


    }
}