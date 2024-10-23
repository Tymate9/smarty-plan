package net.enovea.domain.team

import jakarta.persistence.*

@Entity
@Table(name = "team_category")
class TeamCategoryEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false)
    var label: String=""
)
