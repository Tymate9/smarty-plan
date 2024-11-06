package net.enovea.domain.driver
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import jakarta.transaction.Transactional
import net.enovea.api.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import net.enovea.domain.vehicle.VehicleDriverEntity
import net.enovea.domain.vehicle.VehicleTeamEntity


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
    var phoneNumber: String? = null,

    @OneToMany(
    fetch = FetchType.LAZY,
    mappedBy = "driver",
    cascade = [CascadeType.ALL, CascadeType.REMOVE]
    )
    val vehicleDrivers: List<VehicleDriverEntity> = mutableListOf(),

    @OneToMany(
    fetch = FetchType.LAZY,
    mappedBy = "driver",
    cascade = [CascadeType.ALL, CascadeType.REMOVE]
    )
    val driverTeams: List<DriverTeamEntity> = mutableListOf(),



) : PanacheEntityBase {

    companion object : PanacheCompanionBase<DriverEntity, Int> {
        const val ENTITY_NAME = "DriverEntity"
        const val TABLE_NAME = "driver"

        @Transactional
        fun findByFullNames(fullNames: List<String>): List<DriverEntity> {
            return list("CONCAT(firstName, ' ', lastName) IN ?1", fullNames)
        }
    }
}