package net.enovea.api.poi

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.api.poi.PointOfInterestCategory.PointOfInterestCategoryEntity


@Entity(name=PointOfInterestEntity.ENTITY_NAME)
@Table(name=PointOfInterestEntity.TABLE_NAME)
data class PointOfInterestEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "type", nullable = false)
    var category: PointOfInterestCategoryEntity = PointOfInterestCategoryEntity(),

    var label: String = "",

    var latitude: Double = 0.0,

    var longitude: Double = 0.0,

    var radius: Int = 0,

    ): PanacheEntityBase {

    companion object: PanacheCompanionBase<PointOfInterestEntity, Int> {
        const val ID_SEQUENCE = "point_of_interest_id_seq"
        const val ENTITY_NAME = "PointOfInterest"
        const val TABLE_NAME = "point_of_interest"

        fun getAllWithLittleRadius(): List<PointOfInterestEntity> {
            return listAll().filter { it.radius < 100 }
        }
    }
}