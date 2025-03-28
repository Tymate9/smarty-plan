package net.enovea.vehicle.vehicleDriver
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.persistence.*
import net.enovea.driver.DriverEntity
import net.enovea.vehicle.VehicleEntity
import net.enovea.workInProgress.affectationCRUD.AffectationForm
import net.enovea.workInProgress.affectationCRUD.IAffectationFactory
import net.enovea.workInProgress.affectationCRUD.IAffectationPanacheEntity
import java.io.Serializable
import java.sql.Timestamp

@Entity(name = VehicleDriverEntity.ENTITY_NAME)
@Table(name = VehicleDriverEntity.TABLE_NAME)
data class VehicleDriverEntity (

    @EmbeddedId
    override var id: VehicleDriverId = VehicleDriverId(),

    @Column(name = "end_date", nullable = true)
    override var endDate: Timestamp? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("vehicleId")
    @JoinColumn(name = "vehicle_id", nullable = false)
    val vehicle: VehicleEntity? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("driverId")
    @JoinColumn(name = "driver_id", nullable = false)
    val driver: DriverEntity? = null,


    ): IAffectationPanacheEntity<DriverEntity, VehicleEntity, VehicleDriverId> {

    override fun getStartDate(): Timestamp = id.startDate

    override fun getSubject(): DriverEntity? = driver

    override fun getBuildId(): String = "${id.driverId}_${id.vehicleId}_${id.startDate.time}"

    override fun getTarget(): VehicleEntity? = vehicle

    companion object : PanacheCompanionBase<VehicleDriverEntity, VehicleDriverId>, IAffectationFactory<VehicleDriverEntity, VehicleDriverId> {
        const val ENTITY_NAME = "VehicleDriverEntity"
        const val TABLE_NAME = "vehicle_driver"

        override fun targetIdPath(): String = "vehicle.id"
        override fun subjectIdPath(): String = "driver.id"

        override fun createFromForm(form: AffectationForm): VehicleDriverEntity {
            return VehicleDriverEntity(
                id = createIdFromForm(form),
                endDate = form.endDate,
                vehicle = VehicleEntity.findById(form.targetId.toString()),
                driver = DriverEntity.findById(form.subjectId.toString().toInt())
            )
        }

        override fun createIdFromForm(form: AffectationForm): VehicleDriverId {
            return VehicleDriverId(
                vehicleId = form.targetId.toString(),
                driverId = form.subjectId.toString().toInt(),
                startDate = form.startDate ?: throw IllegalArgumentException("La date de début (startDate) est obligatoire.")
            )
        }
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