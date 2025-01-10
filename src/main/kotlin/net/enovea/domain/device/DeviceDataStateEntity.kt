package net.enovea.domain.device

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.common.geo.IHasCoordinate
import net.enovea.common.geo.IHasCoordinateRepository
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.Polygon
import org.locationtech.jts.geom.impl.CoordinateArraySequence
import java.sql.Timestamp
import mu.KotlinLogging

@Entity(name = DeviceDataStateEntity.ENTITY_NAME )
@Table(name = DeviceDataStateEntity.TABLE_NAME)
data class DeviceDataStateEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "device_data_state_seq")
    @SequenceGenerator(name = "device_data_state_seq", sequenceName = "device_data_state_seq", allocationSize = 1)
    @Column(name = "device_id")
    var device_id: Int = -1,

    @Column(name = "state", length = 128, nullable = true)
    var state: String? = null,

    @Column(name = "first_comm_time", nullable = true)
    var firstCommTime: Timestamp? = null,

    @Column(name = "last_comm_time", nullable = true)
    var lastCommTime: Timestamp? = null,

    @Column(name = "last_received_data_time", nullable = true)
    var lastReceivedDataTime: Timestamp? = null,

    @Column(name = "state_time", nullable = true)
    var stateTime: Timestamp? = null,

    @Column(name = "address", nullable = true)
    var address: String? = null,

    @Column(name = "plugged", nullable = true)
    var plugged: Boolean? = null,

    @Column(name = "last_position")
    override var coordinate: Point? = Point(
        CoordinateArraySequence(arrayOf(Coordinate(0.0, 0.0))),
        GeometryFactory()
    ),

    @Column(name = "last_position_time", nullable = true)
    var lastPositionTime: Timestamp? = null,

    @OneToOne
    @JoinColumn(name = "device_id", referencedColumnName = "id", nullable = false)
    var device: DeviceEntity? = null

) : PanacheEntityBase, IHasCoordinate {

    companion object :
        PanacheCompanionBase<DeviceDataStateEntity, Int>,
        IHasCoordinateRepository<DeviceDataStateEntity>
    {
        private val logger = KotlinLogging.logger {}

        const val ENTITY_NAME = "DeviceDataStateEntity"
        const val TABLE_NAME = "device_data_state"

        /**
         * Spécifie la colonne correspondante à 'coordinate'
         * dans la base (last_position).
         */
        override fun coordinateColumnName(): String = "last_position"

        /**
         * Récupère les entités plus proches d’un point (tri par distance),
         * limite le nombre de résultats.
         */
        override fun findNearestEntity(point: Point, limit: Int): List<DeviceDataStateEntity> {
            val wktPoint = point.toText()
            val coordCol = coordinateColumnName() // ex: "last_position"

            // On part d'une requête JOIN pour lier device_data_state → device_vehicle_install → vehicle
            // On utilise LEFT JOIN vehicle_untracked_period + LEFT JOIN driver_untracked_period
            // afin d’exclure tout enregistrement où vup ou dup sont "actifs" (i.e. end_date IS NULL).
            val query = """
        SELECT e.*,
               ST_Distance(
                   e.$coordCol::geography,
                   ST_GeomFromText(:pointWKT, 4326)::geography
               ) AS distance
        FROM device_data_state e
        JOIN device_vehicle_install dvi ON dvi.device_id = e.device_id
                                        AND dvi.end_date IS NULL
        JOIN vehicle v ON v.id = dvi.vehicle_id
        -- On check si le véhicule est "untracked"
        LEFT JOIN vehicle_untracked_period vup ON vup.vehicle_id = v.id
                                              AND vup.end_date IS NULL
        -- On check le driver
        JOIN vehicle_driver vd ON vd.vehicle_id = v.id
                              AND vd.end_date IS NULL
        LEFT JOIN driver_untracked_period dup ON dup.driver_id = vd.driver_id
                                             AND dup.end_date IS NULL
        WHERE
            -- on exclut les véhicules untracked
            vup.vehicle_id IS NULL
            -- et on exclut les drivers untracked
            AND dup.driver_id IS NULL
        ORDER BY distance
        LIMIT :limit
    """.trimIndent()

            val em = getEntityManager()
            val resultList = em.createNativeQuery(query, DeviceDataStateEntity::class.java)
                .setParameter("pointWKT", wktPoint)
                .setParameter("limit", limit)
                .resultList

            @Suppress("UNCHECKED_CAST")
            return resultList as List<DeviceDataStateEntity>
        }

        /**
         * Version qui renvoie (distance, entité).
         */
        override fun getNearestEntityWithDistance(
            point: Point,
            limit: Int
        ): List<Pair<Double, DeviceDataStateEntity>> {
            val wktPoint = point.toText()
            val coordCol = coordinateColumnName() // ex: "last_position"
            val idFieldName = "device_id"

            // Phase 1 : on récupère (device_id, distance)
            val query = """
        SELECT e.$idFieldName,
               ROUND(
                 ST_Distance(
                   e.$coordCol::geography,
                   ST_GeomFromText(:pointWKT, 4326)::geography
                 ) ::numeric / 1000.0, 2
               ) AS distance
        FROM device_data_state e
        JOIN device_vehicle_install dvi ON dvi.device_id = e.device_id
                                        AND dvi.end_date IS NULL
        JOIN vehicle v ON v.id = dvi.vehicle_id
        LEFT JOIN vehicle_untracked_period vup ON vup.vehicle_id = v.id
                                              AND vup.end_date IS NULL
        JOIN vehicle_driver vd ON vd.vehicle_id = v.id
                              AND vd.end_date IS NULL
        LEFT JOIN driver_untracked_period dup ON dup.driver_id = vd.driver_id
                                             AND dup.end_date IS NULL
        WHERE
            vup.vehicle_id IS NULL
            AND dup.driver_id IS NULL
        ORDER BY distance
        LIMIT :limit
    """.trimIndent()

            val rows = getEntityManager().createNativeQuery(query)
                .setParameter("pointWKT", wktPoint)
                .setParameter("limit", limit)
                .resultList

            // on mappe device_id -> distance
            val idDistanceMap = mutableMapOf<Any, Double>()
            for (row in rows) {
                @Suppress("UNCHECKED_CAST")
                val arrayRow = row as Array<Any>
                val devIdVal = arrayRow[0]
                val distance = (arrayRow[1] as Number).toDouble()
                idDistanceMap[devIdVal] = distance
            }

            // Phase 2 : on recharge les entités par device_id
            val ids = idDistanceMap.keys
            val entities = getEntityManager()
                .createQuery("FROM $ENTITY_NAME WHERE $idFieldName IN :ids", DeviceDataStateEntity::class.java)
                .setParameter("ids", ids)
                .resultList

            // on associe (distance, entité) et on trie
            val resultPairs = entities.map { ent ->
                val dist = idDistanceMap[ent.device_id] ?: 0.0
                dist to ent
            }.sortedBy { it.first }

            return resultPairs
        }


        /**
         * Récupère les entités dont 'coordinate' intersecte un polygone.
         */
        override fun getEntityInPolygon(polygon: Polygon): List<DeviceDataStateEntity> {
            val polygonWKT = polygon.toText()
            val coordCol = coordinateColumnName()

            val query = """
                SELECT e.*
                FROM $TABLE_NAME e
                WHERE ST_Intersects(
                    ST_GeogFromText(:polygonWKT),
                    $coordCol
                )
            """.trimIndent()

            val resultList = getEntityManager().createNativeQuery(query, DeviceDataStateEntity::class.java)
                .setParameter("polygonWKT", polygonWKT)
                .resultList

            @Suppress("UNCHECKED_CAST")
            return resultList as List<DeviceDataStateEntity>
        }

        override fun sortByDistance(entities: List<DeviceDataStateEntity>, point: Point): List<DeviceDataStateEntity> {
            return entities.sortedBy {
                // calcul distance en mémoire
                val coord = it.coordinate
                if (coord != null) coord.distance(point) else Double.POSITIVE_INFINITY
            }
        }
    }

    override fun toString(): String {
        return "DeviceDataStateEntity(lastPositionTime=$lastPositionTime, coordinate=$coordinate, address=$address, stateTime=$stateTime, lastReceivedDataTime=$lastReceivedDataTime, lastCommTime=$lastCommTime, firstCommTime=$firstCommTime, state=$state, device_id=$device_id)"
    }
}