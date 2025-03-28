package net.enovea.vehicle.vehicleTeam

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.inject.Inject
import jakarta.persistence.*
import net.enovea.team.TeamEntity
import net.enovea.team.TeamMapper
import net.enovea.team.TeamDTO
import net.enovea.vehicle.VehicleEntity
import net.enovea.workInProgress.affectationCRUD.AffectationForm
import net.enovea.workInProgress.affectationCRUD.IAffectationFactory
import net.enovea.workInProgress.affectationCRUD.IAffectationPanacheEntity
import java.io.Serializable
import java.sql.Timestamp

@Entity(name = VehicleTeamEntity.ENTITY_NAME)
@Table(name = VehicleTeamEntity.TABLE_NAME)
data class VehicleTeamEntity (

    @EmbeddedId
    override var id: VehicleTeamId = VehicleTeamId(),

    //TODO(Vérifier si la nullité est ok ici)
    @Column(name = "end_date", nullable = true)
    override var endDate: Timestamp?= null,

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("vehicleId")
    @JoinColumn(name = "vehicle_id", referencedColumnName = "id",nullable = false)
    val vehicle: VehicleEntity? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("teamId")
    @JoinColumn(name = "team_id",  referencedColumnName = "id", nullable = false)
    val team: TeamEntity? = null,

    ): IAffectationPanacheEntity<VehicleEntity, TeamEntity, VehicleTeamId> {

    override fun getStartDate(): Timestamp = id.startDate

    override fun getSubject(): VehicleEntity? = vehicle

    override fun getBuildId(): String = "${id.vehicleId}_${id.teamId}_${id.startDate.time}"

    override fun getTarget(): TeamEntity? = team

    companion object : PanacheCompanionBase<VehicleTeamEntity, VehicleTeamId>, IAffectationFactory<VehicleTeamEntity, VehicleTeamId> {
        const val ENTITY_NAME = "VehicleTeamEntity"
        const val TABLE_NAME = "vehicle_team"

        override fun subjectIdPath(): String = "vehicle.id"
        override fun targetIdPath(): String = "team.id"

        /**
         * Returns a map of vehicle IDs with their latest team (where endDate is null).
         */
        fun getLatestTeams(): Map<String, TeamEntity> { // Get the mapper instance

            // Find all entities where endDate is null
            return find("endDate IS NULL")
                .list() // No type argument needed
                .associate { entity ->
                    // Map vehicleId to the corresponding TeamDTO
                    entity.id.vehicleId to (entity.team ?: throw IllegalStateException("Team cannot be null"))
                }
        }

        override fun createFromForm(form: AffectationForm): VehicleTeamEntity {
            return VehicleTeamEntity(
                id = createIdFromForm(form),
                endDate = form.endDate,
                vehicle = VehicleEntity.findById(form.subjectId.toString()),
                team = TeamEntity.findById(form.targetId.toString().toInt())
            )
        }

        override fun createIdFromForm(form: AffectationForm): VehicleTeamId {
            return VehicleTeamId(
                vehicleId = form.subjectId.toString(),
                teamId = form.targetId.toString().toInt(),
                startDate = form.startDate  ?: throw IllegalArgumentException("La date de début (startDate) est obligatoire.")
            )
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
