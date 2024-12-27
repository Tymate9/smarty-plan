package net.enovea.api.poi

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import mu.KotlinLogging
import net.enovea.api.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import net.enovea.workInProgress.IHasArea
import net.enovea.workInProgress.IHasAreaRepository
import net.enovea.workInProgress.IHasCoordinate
import net.enovea.workInProgress.IHasCoordinateRepository
import org.locationtech.jts.geom.*
import org.locationtech.jts.geom.impl.CoordinateArraySequence
import org.locationtech.jts.io.WKTWriter

@Entity(name = PointOfInterestEntity.ENTITY_NAME)
@Table(name = PointOfInterestEntity.TABLE_NAME)
data class PointOfInterestEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = PointOfInterestEntity.ID_SEQUENCE)
    @SequenceGenerator(
        name = PointOfInterestEntity.ID_SEQUENCE,
        sequenceName = PointOfInterestEntity.ID_SEQUENCE,
        allocationSize = 1
    )
    var id: Int = -1,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "type", nullable = false)
    var category: PointOfInterestCategoryEntity = PointOfInterestCategoryEntity(),

    var client_code : String? = "0000",
    var client_label: String = "",

    // Champ coordinate de type Point
    @Column(name = "coordinate")
    override var coordinate: Point = Point(
        CoordinateArraySequence(arrayOf(Coordinate(0.0, 0.0))),
        GeometryFactory()
    ),

    var address: String = "NOT_COMPUTED",

    // Champ area de type Polygon
    @Column(name = "area")
    override var area: Polygon = run {
        val coords = arrayOf(
            Coordinate(0.0, 0.0),
            Coordinate(1.0, 0.0),
            Coordinate(1.0, 1.0),
            Coordinate(0.0, 1.0),
            Coordinate(0.0, 0.0) // Fermer le polygone
        )
        val linearRing = LinearRing(CoordinateArraySequence(coords), GeometryFactory())
        Polygon(linearRing, null, GeometryFactory())
    }

) : PanacheEntityBase, IHasCoordinate, IHasArea {

    fun getDenomination(): String {
        val code = if (client_code.isNullOrEmpty()) "0000" else client_code
        return "$code-$client_label"
    }

    companion object :
        PanacheCompanionBase<PointOfInterestEntity, Int>,
        IHasCoordinateRepository<PointOfInterestEntity>,
        IHasAreaRepository<PointOfInterestEntity>
    {
        private val logger = KotlinLogging.logger {}

        const val ID_SEQUENCE = "point_of_interest_id_seq"
        const val ENTITY_NAME = "PointOfInterest"
        const val TABLE_NAME = "point_of_interest"

        /**
         * Nom de la colonne pour le champ 'coordinate' en base :
         */
        override fun coordinateColumnName(): String = "coordinate"

        /**
         * Nom de la colonne pour le champ 'area' en base :
         */
        override fun areaColumnName(): String = "area"

        /**
         * Méthode existante pour récupérer tous les POI
         */
        fun getAll(): List<PointOfInterestEntity> {
            return listAll()
        }

        // ======================
        // IHasCoordinateRepository Impl
        // ======================

        override fun findNearestEntity(point: Point, limit: Int): List<PointOfInterestEntity> {
            val wktPoint = point.toText()
            val coordCol = coordinateColumnName() // "coordinate"

            val query = """
                SELECT e.*,
                       ST_Distance(
                           e.$coordCol::geography,
                           ST_GeomFromText(:pointWKT, 4326)::geography
                       ) AS distance
                FROM $TABLE_NAME e
                ORDER BY distance
                LIMIT :limit
            """.trimIndent()

            val em = getEntityManager()
            val resultList = em.createNativeQuery(query, PointOfInterestEntity::class.java)
                .setParameter("pointWKT", wktPoint)
                .setParameter("limit", limit)
                .resultList

            @Suppress("UNCHECKED_CAST")
            return resultList as List<PointOfInterestEntity>
        }

        override fun getNearestEntityWithDistance(
            point: Point,
            limit: Int
        ): List<Pair<Double, PointOfInterestEntity>> {
            val wktPoint = point.toText()
            val coordCol = coordinateColumnName()  // "coordinate"
            // Le champ ID pour la requête
            val idFieldName = "id"

            val query = """
                SELECT e.$idFieldName,
                       ROUND(
                         ST_Distance(
                           e.$coordCol::geography,
                           ST_GeomFromText(:pointWKT, 4326)::geography
                         ) ::numeric / 1000.0, 2
                       ) AS distance
                FROM $TABLE_NAME e
                ORDER BY distance
                LIMIT :limit
            """.trimIndent()

            val rows = getEntityManager().createNativeQuery(query)
                .setParameter("pointWKT", wktPoint)
                .setParameter("limit", limit)
                .resultList

            val idDistanceMap = mutableMapOf<Any, Double>()
            for (row in rows) {
                @Suppress("UNCHECKED_CAST")
                val arrayRow = row as Array<Any>
                val poiIdVal = arrayRow[0]
                val distance = (arrayRow[1] as Number).toDouble()
                idDistanceMap[poiIdVal] = distance
            }

            // Recharger les entités depuis la DB via HQL
            val ids = idDistanceMap.keys
            val entities = getEntityManager()
                .createQuery("FROM $ENTITY_NAME WHERE $idFieldName IN :ids", PointOfInterestEntity::class.java)
                .setParameter("ids", ids)
                .resultList

            // Associer (distance, entité)
            val resultPairs = entities.map { ent ->
                val dist = idDistanceMap[ent.id] ?: 0.0
                dist to ent
            }.sortedBy { it.first }

            return resultPairs
        }

        override fun getEntityInPolygon(polygon: Polygon): List<PointOfInterestEntity> {
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

            val resultList = getEntityManager().createNativeQuery(query, PointOfInterestEntity::class.java)
                .setParameter("polygonWKT", polygonWKT)
                .resultList

            @Suppress("UNCHECKED_CAST")
            return resultList as List<PointOfInterestEntity>
        }

        // ==========================
        // IHasAreaRepository Impl
        // ==========================

        override fun findAllIntersectingArea(point: Point): List<PointOfInterestEntity> {
            val wktPoint = point.toText()
            val areaCol = areaColumnName() // "area"

            val query = """
                SELECT e.*
                FROM $TABLE_NAME e
                WHERE ST_Intersects(
                    e.$areaCol::geography,
                    ST_GeomFromText(:pointWKT, 4326)::geography
                )
            """.trimIndent()

            val em = getEntityManager()
            val resultList = em.createNativeQuery(query, PointOfInterestEntity::class.java)
                .setParameter("pointWKT", wktPoint)
                .resultList

            @Suppress("UNCHECKED_CAST")
            return resultList as List<PointOfInterestEntity>
        }

        override fun sortByDistance(entities: List<PointOfInterestEntity>, point: Point): List<PointOfInterestEntity> {
            return entities.sortedBy {
                // calcul distance en mémoire
                val coord = it.coordinate
                if (coord != null) coord.distance(point) else Double.POSITIVE_INFINITY
            }
        }
    }
}

/**
 * Petite extension utilitaire pour convertir un Point en WKT,
 * au besoin, si vous n'utilisez pas déjà .toText() de JTS.
 */
fun Point.toText(): String {
    val wktWriter = WKTWriter()
    return wktWriter.write(this)
}

