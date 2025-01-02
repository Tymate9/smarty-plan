package net.enovea.common.geo

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import mu.KotlinLogging
import net.enovea.workInProgress.IHasArea
import net.enovea.workInProgress.IHasAreaRepository
import net.enovea.workInProgress.IHasCoordinate
import net.enovea.workInProgress.IHasCoordinateRepository
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.Polygon
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObjectInstance

/**
 * SpatialService refactorisé pour utiliser IHasCoordinate / IHasArea
 * au lieu de recourir à la réflexion sur les champs "coordinate" et "area".
 */
class SpatialService(
    private val geoCodingService: GeoCodingService
) {
    private val logger = KotlinLogging.logger {}

    /**
     * Récupère les entités (ayant un 'coordinate') les plus proches d'un [point].
     */
    fun <E> getNearestEntity(
        point: Point,
        limit: Int,
        entityClass: KClass<E>
    ): List<E>
            where E : PanacheEntityBase,
                  E : IHasCoordinate
    {
        // DÉLÉGATION via réflexion
        val repo = extractCoordinateRepository(entityClass)
        return repo.findNearestEntity(point, limit)
    }

    /**
     * Variante qui renvoie (distance, entité).
     */
    fun <E> getNearestEntityWithDistance(
        point: Point,
        limit: Int,
        entityClass: KClass<E>
    ): List<Pair<Double, E>>
            where E : PanacheEntityBase,
                  E : IHasCoordinate
    {
        // DÉLÉGATION via réflexion
        val repo = extractCoordinateRepository(entityClass)
        return repo.getNearestEntityWithDistance(point, limit)
    }

    /**
     * Récupère les entités dont la 'coordinate' est incluse dans un polygone.
     */
    fun <E> getEntityInPolygon(
        polygon: Polygon,
        entityClass: KClass<E>
    ): List<E>
            where E : PanacheEntityBase,
                  E : IHasCoordinate
    {
        // DÉLÉGATION via réflexion
        val repo = extractCoordinateRepository(entityClass)
        return repo.getEntityInPolygon(polygon)
    }

    /**
     * Récupère la nearest entity qui possède un 'area' (Polygon)
     * et un 'coordinate' (pour le ORDER BY distance).
     */
    fun <E> getNearestEntityWithinArea(
        point: Point,
        entityClass: KClass<E>
    ): E?
            where E : PanacheEntityBase,
                  E : IHasCoordinate,
                  E : IHasArea
    {
        // 1) On récupère le repository area
        val areaRepo = extractAreaRepository(entityClass)
        // 2) On récupère le repository coordinate
        val coordinateRepo = extractCoordinateRepository(entityClass)

        // 3) On trouve les entités dont l’area intersecte le point
        val intersecting = areaRepo.findAllIntersectingArea(point)
        if (intersecting.isEmpty()) return null

        // 4) On trie ce sous-ensemble par distance
        val sorted = coordinateRepo.sortByDistance(intersecting, point)

        // 5) On renvoie la première (la plus proche), ou null si la liste est vide
        return sorted.firstOrNull()
    }

    // ======================
    // Méthodes associées au geocoding
    // ======================

    fun <E> getEntityFromAddress(
        address: String,
        limit: Int,
        entityClass: KClass<E>
    ): List<E>
            where E : PanacheEntityBase,
                  E : IHasCoordinate
    {
        val result = geoCodingService.geocode(address)
            ?: throw IllegalArgumentException("Impossible de géocoder l'adresse fournie : $address")
        return getNearestEntity(result.coordinate, limit, entityClass)
    }

    fun getAddressFromEntity(point: Point): String {
        val address = geoCodingService.reverseGeocode(point)
        requireNotNull(address) {
            logger.warn("Impossible de géocoder la coordonnée fournie : {${point.x}, ${point.y}}")
            return "${point.y}, ${point.x}"
        }
        return address
    }

    // ==================================================================
    // Fonctions utilitaires
    // ==================================================================

    /**
     * Récupère la companion object via réflexion,
     * puis la cast en IHasCoordinateRepository<E>.
     */
    private fun <E> extractCoordinateRepository(
        entityClass: KClass<E>
    ): IHasCoordinateRepository<E>
            where E : PanacheEntityBase,
                  E : IHasCoordinate
    {
        val companionObj = entityClass.companionObjectInstance
            ?: throw IllegalArgumentException(
                "No companion object found for ${entityClass.simpleName}"
            )

        @Suppress("UNCHECKED_CAST")
        val repo = companionObj as? IHasCoordinateRepository<E>
            ?: throw IllegalArgumentException(
                "Companion of ${entityClass.simpleName} does not implement IHasCoordinateRepository"
            )

        return repo
    }

    private fun <E> extractAreaRepository(entityClass: KClass<E>): IHasAreaRepository<E>
            where E : PanacheEntityBase, E : IHasArea
    {
        val companionObj = entityClass.companionObjectInstance
            ?: throw IllegalArgumentException(
                "No companion object found for ${entityClass.simpleName}"
            )

        @Suppress("UNCHECKED_CAST")
        val repo = companionObj as? IHasAreaRepository<E>
            ?: throw IllegalArgumentException(
                "Companion of ${entityClass.simpleName} does not implement IHasAreaRepository"
            )

        return repo
    }
}




