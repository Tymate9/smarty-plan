package net.enovea.api.poi

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.api.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import org.locationtech.jts.geom.*
import org.locationtech.jts.geom.impl.CoordinateArraySequence


@Entity(name = PointOfInterestEntity.ENTITY_NAME)
@Table(name = PointOfInterestEntity.TABLE_NAME)
data class PointOfInterestEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "type", nullable = false)
    var category: PointOfInterestCategoryEntity = PointOfInterestCategoryEntity(),

    var client_code : String? = "0000",

    var client_label: String = "",

    @Column(name = "coordinate")
    var coordinate: Point = Point(
        CoordinateArraySequence(arrayOf(Coordinate(0.0, 0.0))),
        GeometryFactory()
    ),

    var address: String = "NOT_COMPUTED",

    var area: Polygon = run {
        val coordinates = arrayOf(
            Coordinate(0.0, 0.0),
            Coordinate(1.0, 0.0),
            Coordinate(1.0, 1.0),
            Coordinate(0.0, 1.0),
            Coordinate(0.0, 0.0) // Fermer le polygone
        )
        val linearRing = LinearRing(
            CoordinateArraySequence(coordinates),
            GeometryFactory()
        )
        Polygon(linearRing, null, GeometryFactory())
    },

) : PanacheEntityBase {
    fun getDenomination(): String = "${if(client_code.isNullOrEmpty()){"0000"}else{client_code}}-${client_label}"

    companion object : PanacheCompanionBase<PointOfInterestEntity, Int> {
        const val ID_SEQUENCE = "point_of_interest_id_seq"
        const val ENTITY_NAME = "PointOfInterest"
        const val TABLE_NAME = "point_of_interest"

        fun getAll(): List<PointOfInterestEntity> {
            return listAll()
        }
    }
}
