package net.enovea.domain.team

import jakarta.persistence.*
import net.enovea.domain.vehicle.VehicleTeamEntity
import java.io.Serializable

@Entity
@Table(name = "team")
class TeamEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false)
    var label: String="",

    var path: String? =null,

    // Self-referencing relationship (team has a parent team)
    @ManyToOne
    @JoinColumn(name = "parent_id")
    var parentTeam: TeamEntity? = null,

    // Many-to-one relationship with TeamCategory
    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    var category: TeamCategoryEntity ?= null,

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "team",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
    )
    val vehicleTeams: List<VehicleTeamEntity> = mutableListOf()


) : Serializable
