package net.enovea.poi.PointOfInterestCategory

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import io.quarkus.security.Authenticated
import jakarta.persistence.*

@Entity(name = PointOfInterestCategoryEntity.ENTITY_NAME)
@Table(name = PointOfInterestCategoryEntity.TABLE_NAME)
data class PointOfInterestCategoryEntity(
    @Id
    @GeneratedValue(strategy =  GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name= ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    var label: String = "",

    var color: String = "",

) : PanacheEntityBase{

    companion object : PanacheCompanionBase<PointOfInterestCategoryEntity, Int>{
        const val ID_SEQUENCE = "point_of_interest_category_id_seq"
        const val ENTITY_NAME = "PointOfInterestCategory"
        const val TABLE_NAME = "point_of_interest_category"

    }
}