package net.enovea.period

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.inject.Inject
import net.enovea.driver.DriverMapper
import net.enovea.driver.driverUntrackedPeriod.DriverUntrackedPeriodEntity
import net.enovea.vehicle.VehicleMapper
import net.enovea.vehicle.vehicleUntrackedPeriod.VehicleUntrackedPeriodEntity
import org.mapstruct.Mapper

@Mapper(componentModel = "cdi")
abstract class PeriodMapper {

    @Inject
    protected lateinit var driverMapper: DriverMapper

    @Inject
    protected lateinit var vehicleMapper: VehicleMapper

    /**
     * Convertit une entité de période (implémentant IPanachePeriodEntity)
     * en un DTO adapté (PeriodDTO). Le type de période est déduit en fonction
     * du type concret de l'entité (DriverUntrackedPeriodEntity, VehicleUntrackedPeriodEntity, etc.).
     */
    fun toDTO(entity: IPanachePeriodEntity<PanacheEntityBase, *>): PeriodDTO<*> {
        // Déduction du periodType à partir de l'entité
        val periodType = when(entity) {
            is DriverUntrackedPeriodEntity -> PeriodType.DRIVER_UP
            is VehicleUntrackedPeriodEntity -> PeriodType.VEHICLE_UP
            else -> throw IllegalArgumentException("Type d'entité non supporté : ${entity::class.simpleName}")
        }

        // Construction du DTO en fonction du type concret de l'entité
        return when(entity) {
            is DriverUntrackedPeriodEntity -> {
                PeriodDTO(
                    id = entity.getBuildId(),
                    startDate = entity.getStartDate(),
                    endDate = entity.endDate,
                    resource = driverMapper.toDto(entity.getResource()),
                    periodType = periodType
                )
            }
            is VehicleUntrackedPeriodEntity -> {
                PeriodDTO(
                    id = entity.getBuildId(),
                    startDate = entity.getStartDate(),
                    endDate = entity.endDate,
                    resource = vehicleMapper.toVehicleDTOSummary(entity.getResource()),
                    periodType = periodType
                )
            }
            else -> throw IllegalArgumentException("Type d'entité non supporté : ${entity::class.simpleName}")
        }
    }
}