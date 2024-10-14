package net.enovea.domain.vehicle

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.Model
import java.util.*

/**
 * Représente un véhicule
 **/

@Entity(name = VehicleEntity.ENTITY_NAME )
@Table(name = VehicleEntity.TABLE_NAME)

data class VehicleEntity(

    /** Identifiant unique du vehicle UUID */
    @Id
    @Column(name = "id", nullable = false)
    val id: String = UUID.randomUUID().toString(),

    @Column(name = "energy", nullable = true)
    var energy: String? = null,

    @Column(name = "engine", nullable = true)
    var engine: String? = null,

    @Column(name = "externalid", nullable = true)
    var externalId: String? = null,

    @Column(name = "validated", nullable = false)
    var validated: Boolean = false


) : PanacheEntityBase, Model<String> {


    override fun getID(): String = id


    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "VehicleEntity"
        const val TABLE_NAME = "vehicle"
        const val ID_COLUMN = "id"
        const val ENERGY_COLUMN = "energy"
        const val ENGINE_COLUMN = "engine"
        const val EXTERNAL_ID_COLUMN = "externalid"
        const val VALIDATED = "validated"

    }
}