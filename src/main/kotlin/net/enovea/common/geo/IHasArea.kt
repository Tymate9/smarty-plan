package net.enovea.common.geo

import org.locationtech.jts.geom.Polygon

interface IHasArea {
    /**
     * Propriété représentant la zone (aire) de l’entité.
     * Elle peut être `null` si l’entité ne définit pas (ou plus) de zone.
     */
    val area: Polygon?

    /**
     * Méthode utilitaire indiquant si l’entité possède (ou non) un [area] valable.
     */
    fun hasArea(): Boolean = area != null
}