package net.enovea.device

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.device.deviceData.DeviceDataStateEntity
import net.enovea.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import jakarta.transaction.Transactional
import net.enovea.api.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import net.enovea.domain.driver.DriverEntity
import net.enovea.domain.vehicle.DeviceVehicleInstallEntity
import net.enovea.domain.vehicle.VehicleDriverEntity
import net.enovea.domain.vehicle.VehicleEntity
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.impl.CoordinateArraySequence
import java.sql.Timestamp

@Entity(name = DeviceEntity.ENTITY_NAME)
@Table(name = DeviceEntity.TABLE_NAME)
data class DeviceEntity (
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    @Column(name = "imei", length = 20, nullable = false)
    var imei: String = "",

    @Column(name = "label", nullable = true)
    var label: String? = null,

    @Column(name = "manufacturer", nullable = true)
    var manufacturer: String? = null,

    @Column(name = "model", nullable = true)
    var model: String? = null,

    @Column(name = "serialnumber", nullable = true)
    var serialNumber: String? = null,

    @Column(name = "simnumber", nullable = true)
    var simNumber: String? = null,

    @Column(name = "comment", nullable = true, columnDefinition = "TEXT")
    var comment: String? = null,


    @Column(name = "enabled", nullable = false)
    var enabled: Boolean? = true,

    //TODO(Voir si on ne peux utiliser un objet par défaut)
    @OneToOne(
        fetch = FetchType.LAZY,
        mappedBy = "device",
        cascade = [CascadeType.ALL],
        orphanRemoval = true
    )
    var deviceDataState: DeviceDataStateEntity? = null

    ): PanacheEntityBase {

    companion object : PanacheCompanionBase<DeviceEntity, Int> {
        const val ENTITY_NAME = "DeviceEntity"
        const val TABLE_NAME = "device"

        @Transactional
        fun findVehiclesAndDriversActiveAt(deviceId: Int, referenceDate: Timestamp): Pair<List<VehicleEntity>, List<DriverEntity>> {
            // 1) Récupération du device
            val device = findById(deviceId) ?: return Pair(emptyList(), emptyList())

            // 2) On récupère toutes les associations DeviceVehicleInstallEntity actives
            //    Critère: device_id = :deviceId
            //             AND (end_date IS NULL OR end_date >= :referenceDate)
            val em = getEntityManager()
            val dviQuery = """
        SELECT dvi 
        FROM DeviceVehicleInstallEntity dvi
        WHERE dvi.device.id = :deviceId
          AND (dvi.endDate IS NULL OR dvi.endDate >= :refDate)
    """.trimIndent()

            val dviList = em.createQuery(dviQuery, DeviceVehicleInstallEntity::class.java)
                .setParameter("deviceId", deviceId)
                .setParameter("refDate", referenceDate)
                .resultList

            // 3) En déduit la liste de véhicules
            val vehicles = dviList.mapNotNull { it.vehicle }.distinct()

            // 4) Pour chaque véhicule, on recherche les associations vehicle_driver actives
            //    => end_date IS NULL ou end_date >= referenceDate
            val drivers = mutableListOf<DriverEntity>()

            for (veh in vehicles) {
                val vdQuery = """
            SELECT vd 
            FROM VehicleDriverEntity vd
            WHERE vd.vehicle.id = :vehicleId
              AND (vd.endDate IS NULL OR vd.endDate >= :refDate)
        """.trimIndent()
                val vdList = em.createQuery(vdQuery, VehicleDriverEntity::class.java)
                    .setParameter("vehicleId", veh.id)
                    .setParameter("refDate", referenceDate)
                    .resultList

                // Pour chaque association, on récupère le DriverEntity
                vdList.mapNotNullTo(drivers) { it.driver }
            }

            // 5) Retourne les deux listes
            //    - vehicles (distinct)
            //    - drivers (potentiellement avec doublons, on peut filtrer si besoin)
            return Pair(vehicles, drivers.distinct())
        }

    }
}
