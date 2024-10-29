package net.enovea.common.geo

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.Column
import jakarta.persistence.Table
import jakarta.persistence.EntityManager
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.Polygon
import kotlin.reflect.KClass

class SpatialService<T : PanacheEntityBase>(
    private val entityClass: KClass<T>,
    private val entityManager: EntityManager,
    private val geoCodingService: GeoCodingService
) {
    // TODO (Ajouter la distance à vol d'oiseaux)
    fun getNearestEntity(point: Point, limit: Int): List<T> {
        val wktPoint = point.toText()

        val tableAnnotation = entityClass.java.getAnnotation(Table::class.java)
        val tableName = tableAnnotation?.name ?: entityClass.simpleName


        val coordinateField = entityClass.java.declaredFields.firstOrNull { it.name == "coordinate" }
        val columnAnnotation = coordinateField?.getAnnotation(Column::class.java)
        val coordinateColumnName = columnAnnotation?.name ?: "coordinate"

        val query = """
            SELECT *
            FROM $tableName e
            ORDER BY ST_Distance(e.$coordinateColumnName::geography, ST_GeomFromText(:pointWKT, 4326)::geography)
            LIMIT :limit
        """.trimIndent()

        val resultList = entityManager.createNativeQuery(query, entityClass.java)
            .setParameter("pointWKT", wktPoint)
            .setParameter("limit", limit)
            .resultList

        @Suppress("UNCHECKED_CAST")
        return resultList as List<T>
    }

    fun getEntityInPolygone(polygon: Polygon): List<T> {
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

    fun getEntityFromAdresse(adresse: String, limit: Int = 1): List<T> {

        val point = geoCodingService.geocode(adresse)
        requireNotNull(point){
            throw IllegalArgumentException("Impossible de géocoder l'adresse fournie.")
        }
        return getNearestEntity(point, limit)
    }

    fun getAdresseFromEntity(point: Point): String {
        val adresse = geoCodingService.reverseGeocode(point)
        requireNotNull(adresse){
            throw IllegalArgumentException("Impossible de géocoder la coordonnée fournie.")
        }
        return adresse
    }
}




