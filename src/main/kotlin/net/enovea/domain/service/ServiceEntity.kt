package net.enovea.domain.service

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.persistence.*
import net.enovea.domain.service.ServiceEntity
import java.util.*


@Entity(name = ServiceEntity.ENTITY_NAME )
@Table(name = ServiceEntity.TABLE_NAME)
 data class ServiceEntity(
    @Id
    @Column(name = "id", nullable = false)
    val id: String = UUID.randomUUID().toString(),

    @Column(name = "label", nullable = false)
    var label: String,

    @Column(name = "team_id", nullable = true)
    var teamId: String? = null


    ) {
   constructor(service : ServiceEntity) : this(
      id=service.id,
      label=service.label,
      teamId=service.teamId
   )




}




