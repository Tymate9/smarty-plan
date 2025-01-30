package net.enovea.vehicle.vehicle_category

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*

@Entity(name = VehicleCategoryEntity.ENTITY_NAME)
@Table(name = VehicleCategoryEntity.TABLE_NAME)

class VehicleCategoryEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Int? = null,

    @Column(nullable = false)
    var label: String=""

) : PanacheEntityBase {
    companion object : PanacheCompanionBase<VehicleCategoryEntity, Int> {
        const val ENTITY_NAME = "VehicleCategoryEntity"
        const val TABLE_NAME = "vehicle_category"
    }
}
