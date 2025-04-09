package net.enovea.spatial

import org.locationtech.jts.geom.Point

interface IHasCoordinate {
    /**
     * Propriété représentant la position de l’entité.
     * Elle peut être `null` si l’entité n’a pas (encore) de position définie.
     */
    val coordinate: Point?

    /**
     * Méthode utilitaire indiquant si l’entité possède (ou non) un [coordinate] valable.
     */
    fun hasCoordinate(): Boolean = coordinate != null
}