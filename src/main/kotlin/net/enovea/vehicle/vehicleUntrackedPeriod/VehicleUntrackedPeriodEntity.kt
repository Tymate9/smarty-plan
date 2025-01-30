package net.enovea.vehicle.vehicleUntrackedPeriod

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import jakarta.transaction.Transactional
import java.io.Serializable
import java.time.LocalDateTime

@Entity(name = VehicleUntrackedPeriodEntity.ENTITY_NAME)
@Table(name = VehicleUntrackedPeriodEntity.TABLE_NAME)

class VehicleUntrackedPeriodEntity(
    @EmbeddedId
    val id: VehicleUntrackedPeriodId = VehicleUntrackedPeriodId(),

    @Column(name = "end_date" , nullable = true)
    val endDate: LocalDateTime? = null

) : PanacheEntityBase {
    companion object : PanacheCompanionBase<VehicleUntrackedPeriodEntity, VehicleUntrackedPeriodId> {
        const val ENTITY_NAME = "VehicleUntrackedPeriodEntity"
        const val TABLE_NAME = "vehicle_untracked_period"

        // Method to find IDs of vehicles with untracked periods
        @Transactional
        fun findVehicleIdsWithUntrackedPeriod(): List<String> {
            return find("endDate IS NULL").list().map { it.id.vehicleId }
        }

    }
}

@Embeddable
data class VehicleUntrackedPeriodId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String = "",

    @Column(name = "start_date", nullable = false)
    val startDate: LocalDateTime = LocalDateTime.now()
) : Serializable