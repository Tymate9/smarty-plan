package net.enovea.domain.driver

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.team.TeamEntity
import java.io.Serializable
import java.sql.Timestamp

@Entity(name = DriverTeamEntity.ENTITY_NAME)
@Table(name = DriverTeamEntity.TABLE_NAME)

data class DriverTeamEntity (

    @EmbeddedId
    val id: DriverTeamId = DriverTeamId(),

    @Column(name = "end_date", nullable = true)
    val endDate: Timestamp=Timestamp(System.currentTimeMillis()),

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("driverId")
    @JoinColumn(name = "driver_id", referencedColumnName = "id",nullable = false)
    val driver: DriverEntity? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("teamId")
    @JoinColumn(name = "team_id",  referencedColumnName = "id", nullable = false)
    val team: TeamEntity? = null,

    ): PanacheEntityBase {

    companion object : PanacheCompanionBase<DriverTeamEntity, DriverTeamId> {
        const val ENTITY_NAME = "DriverTeamEntity"
        const val TABLE_NAME = "driver_team"
    }
}
@Embeddable
data class DriverTeamId(
    @Column(name = "driver_id", nullable = false)
    val driverId: Int=0,

    @Column(name = "team_id", nullable = false)
    val teamId: Int=0,

    @Column(name = "start_date", nullable = false)
    val startDate: Timestamp=Timestamp(System.currentTimeMillis())
) : Serializable
