package net.enovea.api.poi

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.SequenceGenerator
import jakarta.persistence.Table


@Entity(name=PointOfInterestEntity.ENTITY_NAME)
@Table(name=PointOfInterestEntity.TABLE_NAME)
data class PointOfInterestEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    var label: String = "",

    @Enumerated(EnumType.STRING)
    var type: PointOfInterestType = PointOfInterestType.PMU,
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

enum class PointOfInterestType {
    DOMICILE,
    FOURNISSEUR,
    CLIENT,
    BUREAU,
    CHANTIER,
    PROSPECT,
    AUTRE,
    PMU,
}