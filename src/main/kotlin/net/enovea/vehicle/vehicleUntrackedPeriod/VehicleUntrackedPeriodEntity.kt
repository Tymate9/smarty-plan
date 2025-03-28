package net.enovea.vehicle.vehicleUntrackedPeriod

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import jakarta.transaction.Transactional
import net.enovea.vehicle.VehicleEntity
import net.enovea.workInProgress.periodEntityCRUD.IPanachePeriodEntity
import net.enovea.workInProgress.periodEntityCRUD.IPeriodEntity
import net.enovea.workInProgress.periodEntityCRUD.IPeriodFactory
import net.enovea.workInProgress.periodEntityCRUD.PeriodForm
import java.io.Serializable
import java.sql.Timestamp
import java.time.LocalDateTime
import java.time.ZoneOffset

@Entity(name = VehicleUntrackedPeriodEntity.ENTITY_NAME)
@Table(name = VehicleUntrackedPeriodEntity.TABLE_NAME)
class VehicleUntrackedPeriodEntity(
    @EmbeddedId
    override var id: VehicleUntrackedPeriodId = VehicleUntrackedPeriodId(),

    @Column(name = "end_date" , nullable = true)
    override var endDate: Timestamp? = null

) : IPanachePeriodEntity<VehicleEntity, VehicleUntrackedPeriodId> {
    override fun getStartDate(): Timestamp = id.startDate

    override fun getResource(): VehicleEntity = VehicleEntity.findById(id.vehicleId) ?: throw IllegalStateException("Vehicle with id ${id.vehicleId} not found")

    override fun getBuildId(): String = "${id.vehicleId}_${id.startDate.time}"

    companion object : PanacheCompanionBase<VehicleUntrackedPeriodEntity, VehicleUntrackedPeriodId>,
        IPeriodFactory<VehicleUntrackedPeriodEntity, VehicleUntrackedPeriodId> {
        const val ENTITY_NAME = "VehicleUntrackedPeriodEntity"
        const val TABLE_NAME = "vehicle_untracked_period"

        // Method to find IDs of vehicles with untracked periods
        @Transactional
        fun findVehicleIdsWithUntrackedPeriod(): List<String> {
            return find("endDate IS NULL").list().map { it.id.vehicleId }
        }

        override fun createFromForm(form: PeriodForm): VehicleUntrackedPeriodEntity {
            val id = createIdFromForm(form)
            return VehicleUntrackedPeriodEntity(
                id = id,
                endDate = form.endDate
            )
        }

        override fun createIdFromForm(form: PeriodForm): VehicleUntrackedPeriodId {
            val vehicleId = form.resourceId as? String
                ?: throw IllegalArgumentException("resourceId must be of type String")
            val startDate = form.startDate
                ?: throw IllegalArgumentException("startDate cannot be null")
            return VehicleUntrackedPeriodId(
                vehicleId = vehicleId,
                startDate = startDate
            )
        }

        override fun resourceIdPath(): String = "id.vehicleId"
    }
}

@Embeddable
data class VehicleUntrackedPeriodId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String = "",

    @Column(name = "start_date", nullable = false)
    val startDate: Timestamp = Timestamp(System.currentTimeMillis())
) : Serializable