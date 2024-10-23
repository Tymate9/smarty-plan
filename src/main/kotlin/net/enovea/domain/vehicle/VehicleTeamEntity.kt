package net.enovea.domain.vehicle

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.team.TeamEntity
import java.io.Serializable
import java.sql.Timestamp



@Entity(name = VehicleTeamEntity.ENTITY_NAME)
@Table(name = VehicleTeamEntity.TABLE_NAME)
data class VehicleTeamEntity (

    @EmbeddedId
    val id: VehicleTeamId = VehicleTeamId(),

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("vehicleId")  // Maps the vehicleId field from VehicleServiceId to Vehicle
    @JoinColumn(name = "vehicle_id", referencedColumnName = "id",nullable = false)
    val vehicle: VehicleEntity? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("teamId")  // Maps the teamId field from VehicleTeamId to Team
    @JoinColumn(name = "team_id",  referencedColumnName = "id", nullable = false)
    val team: TeamEntity? = null,

): PanacheEntityBase {

    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "VehicleTeamEntity"
        const val TABLE_NAME = "vehicle_team"

    }
}

@Embeddable
data class VehicleTeamId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String="",

    @Column(name = "team_id", nullable = false)
    val teamId: Int=0,

    @Column(name = "date", nullable = false)
    val date: Timestamp=Timestamp(System.currentTimeMillis())
) : Serializable
