package net.enovea.domain.vehicle

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.team.TeamMapper
import net.enovea.dto.TeamDTO
import java.io.Serializable
import java.sql.Timestamp

@Entity(name = VehicleTeamEntity.ENTITY_NAME)
@Table(name = VehicleTeamEntity.TABLE_NAME)
data class VehicleTeamEntity (

    @EmbeddedId
    val id: VehicleTeamId = VehicleTeamId(),

    //TODO(Vérifier si la nullité est ok ici)
    @Column(name = "end_date", nullable = true)
    val endDate: Timestamp?= null,

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("vehicleId")
    @JoinColumn(name = "vehicle_id", referencedColumnName = "id",nullable = false)
    val vehicle: VehicleEntity? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("teamId")
    @JoinColumn(name = "team_id",  referencedColumnName = "id", nullable = false)
    val team: TeamEntity? = null,

): PanacheEntityBase {

    companion object : PanacheCompanionBase<VehicleTeamEntity, VehicleTeamId> {
        const val ENTITY_NAME = "VehicleTeamEntity"
        const val TABLE_NAME = "vehicle_team"

        /**
         * Returns a map of vehicle IDs with their latest team (where endDate is null).
         */
        fun getLatestTeams(): Map<String, TeamDTO> {
            val teamMapper = TeamMapper.INSTANCE // Get the mapper instance

            // Find all entities where endDate is null
            return find("endDate IS NULL")
                .list() // No type argument needed
                .associate { entity ->
                    // Map vehicleId to the corresponding TeamDTO
                    entity.id.vehicleId to (entity.team?.let { teamMapper.toDto(it) }
                        ?: throw IllegalStateException("Team cannot be null"))
                }
        }


    }
}

@Embeddable
data class VehicleTeamId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String="",

    @Column(name = "team_id", nullable = false)
    val teamId: Int=0,

    @Column(name = "start_date", nullable = false)
    val startDate: Timestamp=Timestamp(System.currentTimeMillis())
) : Serializable
