package net.enovea.driver.driverUntrackedPeriod

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.persistence.*
import jakarta.transaction.Transactional
import net.enovea.driver.DriverEntity
import net.enovea.period.IPanachePeriodEntity
import net.enovea.period.IPeriodFactory
import net.enovea.period.PeriodForm
import java.io.Serializable
import java.sql.Timestamp

@Entity(name = DriverUntrackedPeriodEntity.ENTITY_NAME)
@Table(name = DriverUntrackedPeriodEntity.TABLE_NAME)
data class DriverUntrackedPeriodEntity(
    @EmbeddedId
    override var id: DriverUntrackedPeriodId = DriverUntrackedPeriodId(),

    @Column(name = "end_date")
    override var endDate: Timestamp? = null
) : IPanachePeriodEntity<DriverEntity, DriverUntrackedPeriodId>
     {
         override fun getStartDate(): Timestamp = id.startDate
         override fun getResource(): DriverEntity = DriverEntity.findById(id.driverId) ?: throw IllegalStateException("Driver avec l'id ${id.driverId} non trouvé")
         override fun getBuildId(): String = "${id.driverId}_${id.startDate.time}"

         companion object : PanacheCompanionBase<DriverUntrackedPeriodEntity, DriverUntrackedPeriodId>,
             IPeriodFactory<DriverUntrackedPeriodEntity, DriverUntrackedPeriodId> {
             const val ENTITY_NAME = "DriverUntrackedPeriodEntity"
             const val TABLE_NAME = "driver_untracked_period"

             // Method to find IDs of vehicles with untracked periods
             @Transactional
             fun findDriverIdsWithUntrackedPeriod(): List<Int> {
            return DriverUntrackedPeriodEntity.find("endDate IS NULL").list().map { it.id.driverId }
        }
             override fun createFromForm(form: PeriodForm): DriverUntrackedPeriodEntity {
            val id = createIdFromForm(form)
            return DriverUntrackedPeriodEntity(
                id = id,
                endDate = form.endDate
            )
        }
             override fun createIdFromForm(form: PeriodForm): DriverUntrackedPeriodId {
                 val driverId = form.resourceId as? Int
                     ?: throw IllegalArgumentException("resourceId doit être de type Int")
            val startDate = form.startDate
                ?: throw IllegalArgumentException("startDate ne peut être null")
            return DriverUntrackedPeriodId(
                driverId = driverId,
                startDate = startDate
            )
        }

        override fun resourceIdPath(): String = "id.driverId"
    }

}
@Embeddable
data class DriverUntrackedPeriodId(
    @Column(name = "driver_id", nullable = false)
    val driverId: Int = -1,

    @Column(name = "start_date", nullable = false)
    val startDate: Timestamp = Timestamp(System.currentTimeMillis())
) : Serializable