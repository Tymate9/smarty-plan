package net.enovea.domain.vehicle.vehicle_service

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import net.enovea.domain.service.ServiceEntity
import net.enovea.domain.vehicle.VehicleEntity
import java.io.Serializable
import java.sql.Timestamp

@Embeddable
data class VehicleServiceId(
    @Column(name = "vehicle_id", nullable = false)
    val vehicleId: String="",

    @Column(name = "service_id", nullable = false)
    val serviceId: Int=0,

    @Column(name = "date", nullable = false)
    val date: Timestamp=Timestamp(System.currentTimeMillis())
) : Serializable // Must be serializable for composite keys


@Entity(name = VehicleService.ENTITY_NAME)
@Table(name = VehicleService.TABLE_NAME)
data class VehicleService (

    @EmbeddedId
    val id: VehicleServiceId = VehicleServiceId(),

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("vehicleId")  // Maps the vehicleId field from VehicleServiceId to Vehicle
    @JoinColumn(name = "vehicle_id", referencedColumnName = "id",nullable = false)
    val vehicle: VehicleEntity? = null,  // Many-to-one relationship with Vehicle

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("serviceId")  // Maps the serviceId field from VehicleServiceId to Service
    @JoinColumn(name = "service_id",  referencedColumnName = "id", nullable = false)
    val service: ServiceEntity? = null,  // Many-to-one relationship with Service

//    @Column(name = "date", nullable = false)
//    var date: Timestamp = Timestamp(System.currentTimeMillis())  // Date when the service was done

): PanacheEntityBase {

    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "VehicleService"
        const val TABLE_NAME = "vehicle_service"



    }
}