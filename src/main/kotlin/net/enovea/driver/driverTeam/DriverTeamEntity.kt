package net.enovea.driver.driverTeam

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.persistence.*
import net.enovea.driver.DriverEntity
import net.enovea.team.TeamEntity
import net.enovea.affectation.AffectationForm
import net.enovea.affectation.IAffectationFactory
import net.enovea.affectation.IAffectationPanacheEntity
import java.io.Serializable
import java.sql.Timestamp

@Entity(name = DriverTeamEntity.ENTITY_NAME)
@Table(name = DriverTeamEntity.TABLE_NAME)
data class DriverTeamEntity (

    @EmbeddedId
    override var id: DriverTeamId = DriverTeamId(),

    @Column(name = "end_date", nullable = true)
    override var endDate : Timestamp? = Timestamp(System.currentTimeMillis()),

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("driverId")
    @JoinColumn(name = "driver_id", referencedColumnName = "id",nullable = false)
    val driver: DriverEntity? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("teamId")
    @JoinColumn(name = "team_id",  referencedColumnName = "id", nullable = false)
    val team: TeamEntity? = null,

    ): IAffectationPanacheEntity<DriverEntity, TeamEntity, DriverTeamId> {

    override fun getStartDate(): Timestamp = id.startDate

    override fun getSubject(): DriverEntity? = driver

    override fun getBuildId(): String = "${id.driverId}_${id.teamId}_${id.startDate.time}"

    override fun getTarget(): TeamEntity? = team

    companion object : PanacheCompanionBase<DriverTeamEntity, DriverTeamId>,
        IAffectationFactory<DriverTeamEntity, DriverTeamId> {
        const val ENTITY_NAME = "DriverTeamEntity"
        const val TABLE_NAME = "driver_team"

        override fun subjectIdPath(): String = "driver.id"
        override fun targetIdPath(): String = "team.id"


        override fun createFromForm(form: AffectationForm): DriverTeamEntity {
            return DriverTeamEntity(
                id = createIdFromForm(form),
                endDate = form.endDate,
                team = TeamEntity.findById(form.targetId.toString().toInt()),
                driver = DriverEntity.findById(form.subjectId.toString().toInt())
            )
        }

        override fun createIdFromForm(form: AffectationForm): DriverTeamId {
            return DriverTeamId(
                teamId = form.targetId.toString().toInt(),
                driverId = form.subjectId.toString().toInt(),
                startDate = form.startDate ?: throw IllegalArgumentException("La date de début (startDate) est obligatoire.")
            )
        }
    }
}

//TODO(Créer un implémenter une interface pour chaque ID)
@Embeddable
data class DriverTeamId(
    @Column(name = "driver_id", nullable = false)
    val driverId: Int=0,

    @Column(name = "team_id", nullable = false)
    val teamId: Int=0,

    @Column(name = "start_date", nullable = false)
    val startDate: Timestamp=Timestamp(System.currentTimeMillis())
) : Serializable
