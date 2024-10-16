package net.enovea.domain.service

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.api.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import net.enovea.domain.vehicle.VehicleService


@Entity(name = ServiceEntity.ENTITY_NAME )
@Table(name = ServiceEntity.TABLE_NAME)
 data class ServiceEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = ID_SEQUENCE)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: Int = -1,

    @Column(name = "label", nullable = false)
    var label: String="",

    @Column(name = "team_id", nullable = true)
    var teamId: String? = null,

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "service",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
    )

    val vehicleServices: List<VehicleService> = mutableListOf()  // One service can be associated with many vehicles



    ): PanacheEntityBase {
    constructor(service : ServiceEntity) : this(
        id=service.id,
        label=service.label,
        teamId=service.teamId
    )


    companion object : PanacheCompanionBase<ServiceEntity, String> {
        const val ENTITY_NAME = "ServiceEntity"
        const val TABLE_NAME = "service"
        const val COLUMN_ID = "id"
    }
}



