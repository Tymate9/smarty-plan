package net.enovea.workInProgress

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.Polygon

/**
 * Contrat d’un repository (Panache companion) pour les entités
 * qui implémentent [IHasCoordinate].
 *
 * Chaque entité concrète (via sa companion) pourra implémenter
 * cette interface pour réaliser des requêtes spatiales spécifiques.
 */
interface IHasCoordinateRepository<E>
        where E : IHasCoordinate,
              E : PanacheEntityBase
{
    /**
     * Récupère les entités [E] plus proches d’un [point],
     * classées par distance ascendante, limitées à [limit].
     */
    fun findNearestEntity(point: Point, limit: Int): List<E>

    /**
     * Variante qui renvoie (distance, entité).
     * Les entités [E] sont toujours classées par distance à [point].
     */
    fun getNearestEntityWithDistance(point: Point, limit: Int): List<Pair<Double, E>>

    /**
     * Renvoie toutes les entités [E] dont le champ [coordinate]
     * intersecte le [polygon] fourni.
     */
    fun getEntityInPolygon(polygon: Polygon): List<E>

    /**
     * Trie en mémoire (in-memory) la liste [entities] par distance
     * entre leur [coordinate] et le [point] fourni,
     * du plus proche au plus lointain.
     */
    fun sortByDistance(entities: List<E>, point: Point): List<E>

    /**
     * Nom de la colonne en base de données correspondant à la propriété [coordinate].
     */
    fun coordinateColumnName(): String = "coordinate"
}