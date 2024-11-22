package net.enovea.common.geo

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.Polygon
import kotlin.reflect.KClass

// TODO(Ajouter l'interface geoEntity)
class SpatialService<T : PanacheEntityBase>(
    private val entityClass: KClass<T>,
    private val entityManager: EntityManager,
    private val geoCodingService: GeoCodingService
) {
    fun getNearestEntity(point: Point, limit: Int): List<T> {
        val wktPoint = point.toText()

        val tableAnnotation = entityClass.java.getAnnotation(Table::class.java)
        val tableName = tableAnnotation?.name ?: entityClass.simpleName


        val coordinateField = entityClass.java.declaredFields.firstOrNull { it.name == "coordinate" }
        val columnAnnotation = coordinateField?.getAnnotation(Column::class.java)
        val coordinateColumnName = columnAnnotation?.name ?: "coordinate"

        val query = """
            SELECT e.*, ST_Distance(
            e.$coordinateColumnName::geography,
            ST_GeomFromText(:pointWKT, 4326)::geography
            ) AS distance
            FROM $tableName e
            ORDER BY distance
            LIMIT :limit
        """.trimIndent()

        val resultList = entityManager.createNativeQuery(query, entityClass.java)
            .setParameter("pointWKT", wktPoint)
            .setParameter("limit", limit)
            .resultList

        @Suppress("UNCHECKED_CAST")
        return resultList as List<T>
    }

    fun getNearestEntityWithDistance(point: Point, limit : Int) : List<Pair<Double, T>>{
        val wktPoint = point.toText()

        val tableAnnotation = entityClass.java.getAnnotation(Table::class.java)
        val tableName = tableAnnotation?.name ?: entityClass.simpleName

        val entityAnnotation = entityClass.java.getAnnotation(Entity::class.java)
        val entityName = entityAnnotation?.name?.takeIf { it.isNotBlank() } ?: entityClass.simpleName

        val coordinateField = entityClass.java.declaredFields.firstOrNull { it.name == "coordinate" }
            ?: throw IllegalArgumentException("Le champ 'coordinate' n'a pas été trouvé dans la classe ${entityClass.simpleName}")
        val columnAnnotation = coordinateField.getAnnotation(Column::class.java)
        val coordinateColumnName = columnAnnotation?.name ?: "coordinate"

        // Trouver le champ annoté avec @Id
        val idField = entityClass.java.declaredFields.firstOrNull { it.isAnnotationPresent(Id::class.java) }
            ?: throw IllegalArgumentException("Aucun champ annoté avec @Id trouvé dans ${entityClass.simpleName}")

        val idFieldName = idField.name

        val query = """
        SELECT e.$idFieldName, ROUND(ST_Distance(
            e.$coordinateColumnName::geography,
            ST_GeomFromText(:pointWKT, 4326)::geography
        ) ::numeric / 1000.0 , 2) AS distance
        FROM $tableName e
        ORDER BY distance
        LIMIT :limit
    """.trimIndent()

        val resultList = entityManager.createNativeQuery(query)
            .setParameter("pointWKT", wktPoint)
            .setParameter("limit", limit)
            .resultList

        val idDistanceMap = mutableMapOf<Any, Double>()

        for (result in resultList) {
            val row = result as Array<Any>
            val id = row[0]
            val distance = (row[1] as Number).toDouble()
            idDistanceMap[id] = distance
        }

        // Récupérer les entités correspondantes en une seule requête HQL
        val ids = idDistanceMap.keys
        val entities = entityManager.createQuery("FROM $entityName WHERE $idFieldName IN :ids", entityClass.java)
            .setParameter("ids", ids)
            .resultList

        // Associer les distances aux entités
        val entitiesWithDistances = entities.map { entity ->
            idField.isAccessible = true
            val id = idField.get(entity)
            val distance = idDistanceMap[id] ?: 0.0
            Pair(distance, entity)
        }.sortedBy { it.first }

        return entitiesWithDistances
    }

    fun getEntityInPolygon(polygon: Polygon): List<T> {
        val polygonWKT = polygon.toText()

        val tableAnnotation = entityClass.java.getAnnotation(Table::class.java)
        val tableName = tableAnnotation?.name ?: entityClass.simpleName

        val coordinateField = entityClass.java.declaredFields.firstOrNull { it.name == "coordinate" }
            ?: throw IllegalArgumentException("Le champ 'coordinate' n'a pas été trouvé dans la classe ${entityClass.simpleName}")
        val columnAnnotation = coordinateField.getAnnotation(Column::class.java)
        val coordinateColumnName = columnAnnotation?.name ?: "coordinate"

        // Écrire la requête SQL
        val query = """
            SELECT *
            FROM $tableName
            WHERE ST_Intersects(ST_GeogFromText(:polygonWKT), $coordinateColumnName)
        """.trimIndent()

        // Exécuter la requête
        val resultList = entityManager.createNativeQuery(query, entityClass.java)
            .setParameter("polygonWKT", polygonWKT)
            .resultList

        @Suppress("UNCHECKED_CAST")
        return resultList as List<T>
    }

    fun getEntityFromAddress(address: String, limit: Int = 1): List<T> {

        val point = geoCodingService.geocode(address)
        requireNotNull(point){
            throw IllegalArgumentException("Impossible de géocoder l'adresse fournie.")
        }
        return getNearestEntity(point, limit)
    }

    fun getAddressFromEntity(point: Point): String {
        val address = geoCodingService.reverseGeocode(point)
        requireNotNull(address){
            throw IllegalArgumentException("Impossible de géocoder la coordonnée fournie : {${point.x}, ${point.y}}")
        }
        return address
    }

    fun getNearestEntityWithinRadius(point: Point, radius: Double): T? {
        val wktPoint = point.toText()

        val tableAnnotation = entityClass.java.getAnnotation(Table::class.java)
        val tableName = tableAnnotation?.name ?: entityClass.simpleName

        val coordinateField = entityClass.java.declaredFields.firstOrNull { it.name == "coordinate" }
            ?: throw IllegalArgumentException("Le champ 'coordinate' n'a pas été trouvé dans la classe ${entityClass.simpleName}")
        val columnAnnotation = coordinateField.getAnnotation(Column::class.java)
        val coordinateColumnName = columnAnnotation?.name ?: "coordinate"

        val query = """
            SELECT e.*
            FROM $tableName e
            WHERE ST_DWithin(
                e.$coordinateColumnName::geography,
                ST_GeomFromText(:pointWKT, 4326)::geography,
                :radius
            )
            ORDER BY ST_Distance(
                e.$coordinateColumnName::geography,
                ST_GeomFromText(:pointWKT, 4326)::geography
            )
            LIMIT 1
        """.trimIndent()

        val resultList = entityManager.createNativeQuery(query, entityClass.java)
            .setParameter("pointWKT", wktPoint)
            .setParameter("radius", radius)
            .resultList

        @Suppress("UNCHECKED_CAST")
        return resultList.firstOrNull() as T?
    }
}




