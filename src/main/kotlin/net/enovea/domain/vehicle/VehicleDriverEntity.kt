package net.enovea.domain.vehicle
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import jakarta.transaction.Transactional
import net.enovea.domain.driver.DriverEntity
import java.io.Serializable
import java.sql.Timestamp
import java.time.LocalDate

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

        @Transactional
        fun getForVehicleAtDateIfTracked(vehicleId: String, date: LocalDate): VehicleDriverEntity? = find(
            """
                SELECT vd 
                FROM VehicleDriverEntity vd 
                    JOIN FETCH vd.driver d
                    JOIN FETCH vd.vehicle v
                    LEFT JOIN VehicleUntrackedPeriodEntity vup 
                        ON vup.id.vehicleId = v.id 
                        AND vup.id.startDate <= :date 
                        AND (vup.endDate IS NULL OR vup.endDate >= :date)    
                    LEFT JOIN DriverUntrackedPeriodEntity dup 
                        ON dup.id.driverId = d.id 
                        AND dup.id.startDate <= :date 
                        AND (dup.endDate IS NULL OR dup.endDate >= :date)      
                WHERE v.id = :vehicleId 
                    AND vd.id.startDate <= :date 
                    AND (vd.endDate IS NULL OR vd.endDate >= :date) 
                    AND vup.id.startDate IS NULL
                    AND dup.id.startDate IS NULL
                """.trimIndent(),
            mapOf("vehicleId" to vehicleId, "date" to date.atStartOfDay())
        ).firstResult()
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