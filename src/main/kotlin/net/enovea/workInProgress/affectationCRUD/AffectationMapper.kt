package net.enovea.workInProgress.affectationCRUD

import jakarta.inject.Inject
import net.enovea.driver.DriverMapper
import net.enovea.driver.driverTeam.DriverTeamEntity
import net.enovea.team.TeamMapper
import net.enovea.vehicle.VehicleMapper
import net.enovea.vehicle.VehicleService
import net.enovea.vehicle.vehicleDriver.VehicleDriverEntity
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import org.mapstruct.Mapper

@Mapper(componentModel = "cdi")
abstract class AffectationMapper {
    @Inject
    private lateinit var vehicleMapper: VehicleMapper
    @Inject
    private lateinit var teamMapper: TeamMapper
    @Inject
    private lateinit var driverMapper: DriverMapper

    /**
     * Unique méthode qui détermine automatiquement l’affectationType et
     * construit le DTO en fonction du type concret de l’entité (VehicleDriverEntity, etc.)
     */
    fun toDTO(
        entity: IAffectationPanacheEntity<*, *, *>,
        fallbackType: AffectationType<*, *, *, *>? = null
    ): AffectationDTO<*, *> {
        // On regarde si un type prioritaire est fourni par fallbackType,
        // sinon on fait un when sur l'entité
        val affectationType = fallbackType ?: when (entity) {
            is VehicleDriverEntity -> AffectationType.DRIVER_VEHICLE
            is DriverTeamEntity    -> AffectationType.DRIVER_TEAM
            is VehicleTeamEntity   -> AffectationType.VEHICLE_TEAM
            else -> throw IllegalArgumentException(
                "Type d'entité non supporté : ${entity::class.simpleName}"
            )
        }

        // Construction du DTO adapté en fonction du type concret
        return when (entity) {
            is VehicleDriverEntity -> {
                AffectationDTO(
                    id = entity.getBuildId(),
                    startDate = entity.getStartDate(),
                    endDate = entity.endDate,
                    subject = entity.driver?.let { driverMapper.toDto(it) },    // DriverEntity
                    target =  entity.vehicle?.let {  vehicleMapper.toVehicleDTOSummary(it) },    // VehicleEntity
                    affectationType = affectationType
                )
            }
            is DriverTeamEntity -> {
                AffectationDTO(
                    id = entity.getBuildId(),
                    startDate = entity.getStartDate(),
                    endDate = entity.endDate,
                    subject = entity.driver?.let { driverMapper.toDto(it) },    // DriverEntity
                    target = entity.team?.let { teamMapper.toDto(it) },       // TeamEntity
                    affectationType = affectationType
                )
            }
            is VehicleTeamEntity -> {
                AffectationDTO(
                    id = entity.getBuildId(),
                    startDate = entity.getStartDate(),
                    endDate = entity.endDate,
                    subject = entity.vehicle?.let {  vehicleMapper.toVehicleDTOSummary(it) },   // VehicleEntity
                    target = entity.team?.let { teamMapper.toDto(it) },       // TeamEntity
                    affectationType = affectationType
                )
            }
            else -> throw IllegalArgumentException(
                "Type d'entité non supporté : ${entity::class.simpleName}"
            )
        }
    }
}