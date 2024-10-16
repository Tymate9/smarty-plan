package net.enovea.domain.vehicle

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.api.poi.PointOfInterestEntity.Companion.ID_SEQUENCE

/**
 * Représente un véhicule
 **/


@Entity(name = VehicleEntity.ENTITY_NAME )
@Table(name = VehicleEntity.TABLE_NAME)

data class VehicleEntity(

    /** Identifiant unique du vehicle UUID */

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    @Column(name = "energy", nullable = true)
    var energy: String? = null,

    @Column(name = "engine", nullable = true)
    var engine: String? = null,

    @Column(name = "externalid", nullable = true)
    var externalId: String? = null,

    @Column(name = "validated", nullable = false)
    var validated: Boolean = false,


    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "vehicle",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
        )
    val vehicleServices: List<VehicleService> = mutableListOf(),  // One vehicle can have many services

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "vehicle",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
        )
    val vehicleDrivers: List<VehicleDriver> = mutableListOf()  // One vehicle can have many drivers


) : PanacheEntityBase {


    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "VehicleEntity"
        const val TABLE_NAME = "vehicle"
        const val COLUMN_ID = "id"


    }
}