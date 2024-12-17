package net.enovea.domain.vehicle

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import jakarta.transaction.Transactional
import java.io.Serializable
import java.time.LocalDateTime

@Entity(name = DriverUntrackedPeriodEntity.ENTITY_NAME)
@Table(name = DriverUntrackedPeriodEntity.TABLE_NAME)
data class DriverUntrackedPeriodEntity(
    @EmbeddedId
    val id: DriverUntrackedPeriodId =DriverUntrackedPeriodId() ,

    @Column(name = "end_date")
    val endDate: LocalDateTime? = null
) : PanacheEntityBase {
    companion object : PanacheCompanionBase<DriverUntrackedPeriodEntity, DriverUntrackedPeriodId> {
        const val ENTITY_NAME = "DriverUntrackedPeriodEntity"
        const val TABLE_NAME = "driver_untracked_period"

        // Method to find IDs of vehicles with untracked periods
        @Transactional
        fun findDriverIdsWithUntrackedPeriod(): List<Int> {
            return DriverUntrackedPeriodEntity.find("endDate IS NULL").list().map { it.id.driverId }
        }
    }
}
@Embeddable
data class DriverUntrackedPeriodId(
    @Column(name = "driver_id", nullable = false)
    val driverId: Int = -1,

    @Column(name = "start_date", nullable = false)
    val startDate: LocalDateTime = LocalDateTime.now()
) : Serializable