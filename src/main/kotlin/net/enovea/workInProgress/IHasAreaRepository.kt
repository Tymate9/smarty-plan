package net.enovea.workInProgress

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import org.locationtech.jts.geom.Point

/**
 * Contrat d’un repository (Panache companion) pour les entités
 * qui implémentent [IHasArea].
 *
 * Chaque entité concrète (via sa companion) pourra implémenter
 * ces méthodes pour réaliser des requêtes liées à `area`.
 */
interface IHasAreaRepository<E>
        where E : PanacheEntityBase,
              E : IHasArea
{
    /**
     * Nom de la colonne en base de données correspondant à la propriété [area].
     * Par défaut, "area", mais chaque implémentation peut redéfinir cette valeur
     * pour coller au nom effectif de la colonne dans la BDD.
     */
    fun areaColumnName(): String = "area"

    /**
     * Renvoie la liste de toutes les entités [E] dont
     * la propriété [area] intersecte le [point] fourni.
     *
     * L’implémentation habituelle utilisera un `ST_Intersects`,
     * par exemple :
     *
     *  SELECT e.*
     *  FROM my_table e
     *  WHERE ST_Intersects(
     *      e.areaColumnName(),
     *      ST_GeomFromText(:pointWKT, 4326)
     *  )
     */
    fun findAllIntersectingArea(point: Point): List<E>
}