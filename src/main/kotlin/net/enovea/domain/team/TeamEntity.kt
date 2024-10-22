package net.enovea.domain.team


import jakarta.persistence.*
import java.io.Serializable

@Entity
@Table(name = "team")
class TeamEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false)
    var label: String="",

    // Self-referencing relationship (team has a parent team)
    @ManyToOne
    @JoinColumn(name = "parent_id")
    var parentTeam: TeamEntity? = null,

    // Many-to-one relationship with TeamCategory
    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    var category: TeamCategoryEntity ?= null,

    var path: String? =null
) : Serializable
