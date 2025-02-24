package net.enovea.domain.device

import mu.KotlinLogging
import net.enovea.api.vehicle.VehicleResource
import net.enovea.domain.driver.DriverEntity
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.vehicle.VehicleEntity
import net.enovea.dto.DeviceDataStateDTO
import org.jboss.logging.Logger
import org.locationtech.jts.geom.Point
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers
import java.sql.Timestamp
import java.time.Duration
import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId
import java.time.temporal.Temporal


@Mapper
interface DeviceDataStateMapper {

    @Mapping(source=".", target = "state", qualifiedByName = ["BR_StateMapper"])
    @Mapping(source = ".", target = "coordinate", qualifiedByName = ["BR_LunchBreakPositionMapper"])
    @Mapping(source = ".", target = "address", qualifiedByName = ["BR_LunchBreakAddressMapper"])
    fun toDto(deviceDataState: DeviceDataStateEntity): DeviceDataStateDTO

    fun toEntity(deviceDataStateDTO: DeviceDataStateDTO): DeviceDataStateEntity

    @Named("BR_StateMapper")
    fun StateMapper(deviceDataState: DeviceDataStateEntity) : String? {
        return if(deviceDataState.lastCommTime?.toInstant().until(Instant.now()).toHours() >= 12) {
            "NO_COM"
        }else {
            deviceDataState.state
        }
    }

    companion object {
        val INSTANCE: DeviceDataStateMapper = Mappers.getMapper(DeviceDataStateMapper::class.java)

    }

    @Named("BR_LunchBreakPositionMapper")
    fun mapPositionDuringLunchBreak(entity: DeviceDataStateEntity): Point? {
        val referenceDate = Timestamp(System.currentTimeMillis())

        val (vehicles, drivers) = DeviceEntity.findVehiclesAndDriversActiveAt(entity.device_id, referenceDate)

        val (earliestStart, latestEnd) = computeFinalLunchBreakWindow(vehicles, drivers, referenceDate)

        return if (isInPause(entity.lastPositionTime, earliestStart, latestEnd)) {
            null
        } else {
            entity.coordinate
        }
    }
    @Named("BR_LunchBreakAddressMapper")
    fun mapAddressDuringLunchBreak(entity: DeviceDataStateEntity): String? {
        val referenceDate = Timestamp(System.currentTimeMillis())
        val (vehicles, drivers) = DeviceEntity.findVehiclesAndDriversActiveAt(entity.device_id, referenceDate)
        val (earliestStart, latestEnd) = computeFinalLunchBreakWindow(vehicles, drivers, referenceDate)

        return if (isInPause(entity.lastPositionTime, earliestStart, latestEnd)) {
            val startStr = earliestStart?.toString() ?: "??:??"
            val endStr   = latestEnd?.toString()   ?: "??:??"
            "pause midi de $startStr à $endStr"
        } else {
            entity.address
        }
    }

    //TODO(Ces fonctionnalités doivent être déplacés)

    /**
     * Vérifie si [lastPositionTime] tombe dans l’intervalle [earliestStart, latestEnd].
     * On compare uniquement l'heure du jour, pas la date complète.
     * - earliestStart / latestEnd peuvent être null -> aucune pause => false
     */
    private fun isInPause( lastPositionTime: Timestamp?, earliestStart: LocalTime?, latestEnd: LocalTime? ): Boolean {
        if (lastPositionTime == null || earliestStart == null || latestEnd == null) return false
        val localTime = lastPositionTime.toInstant()
            .atZone(ZoneId.systemDefault())
            .toLocalTime()

        // On considère [start <= localTime <= end] comme "dans la pause"
        return !localTime.isBefore(earliestStart) && !localTime.isAfter(latestEnd)
    }

    /**
     * Calcule la fenêtre de pause "globale" en fonction de :
     * - toutes les teams actives du driver (si existant)
     * - toutes les teams actives du véhicule
     * - pour chacune, on remonte le parentTeam si besoin (héritage)
     * - on récupère la liste de (start, end) non-null
     * - on prend la plus tôt pour start, la plus tard pour end
     */
    private fun computeFinalLunchBreakWindow( vehicles: List<VehicleEntity>, drivers: List<DriverEntity>, refDate: Timestamp ): Pair<LocalTime?, LocalTime?> {
        // 1. Récupérer TOUTES les teams actives (driverTeam, vehicleTeam)
        val allTeams = mutableSetOf<TeamEntity>()
        drivers.forEach { driver ->
            val activeDriverTeams = findActiveDriverTeams(driver, refDate)
            allTeams.addAll(activeDriverTeams)
        }
        vehicles.forEach { vehicle ->
            val activeVehicleTeams = findActiveVehicleTeams(vehicle, refDate)
            allTeams.addAll(activeVehicleTeams)
        }

        // 2. Pour chacune de ces teams, on remonte le parentTeam si lunchBreakStart ou lunchBreakEnd est null
        //    ou selon les règles d’héritage. Par simplicité, on va chercher la "vraie" start / end
        //    en grimpant les parents tant que c’est null. (On devras itérer plus proprement)
        val timeRanges = allTeams.mapNotNull { team ->
            val finalStart = findInheritedStart(team)
            val finalEnd = findInheritedEnd(team)
            // si un des deux est null, on ignore => pas de pause valable
            if (finalStart != null && finalEnd != null) Pair(finalStart, finalEnd) else null
        }

        // 3. On récupère le plus tôt (min) et le plus tard (max)
        val earliestStart = timeRanges.minByOrNull { it.first }?.first
        val latestEnd     = timeRanges.maxByOrNull { it.second }?.second

        return Pair(earliestStart, latestEnd)
    }

    /**
     * Retourne la liste des teams "actives" pour un driver, à la date [refDate].
     * => endDate IS NULL ou endDate >= refDate
     */
    private fun findActiveDriverTeams(driver: DriverEntity, refDate: Timestamp): List<TeamEntity> {
        return driver.driverTeams
            .filter { it.endDate == null || it.endDate!! >= refDate }
            .mapNotNull { it.team }
            .distinct()
    }

    /**
     * Retourne la liste des teams "actives" pour un véhicule, à la date [refDate].
     */
    private fun findActiveVehicleTeams(vehicle: VehicleEntity, refDate: Timestamp): List<TeamEntity> {
        return vehicle.vehicleTeams
            .filter { it.endDate == null || it.endDate!! >= refDate }
            .mapNotNull { it.team }
            .distinct()
    }

    /**
     * Héritage : si [team.lunchBreakStart] est null, on remonte dans team.parentTeam
     * jusqu’à trouver une valeur non-nulle ou arriver en haut.
     */
    private fun findInheritedStart(team: TeamEntity?): LocalTime? {
        if (team == null) return null
        return team.lunchBreakStart ?: findInheritedStart(team.parentTeam)
    }

    /**
     * Idem pour la fin de pause
     */
    private fun findInheritedEnd(team: TeamEntity?): LocalTime? {
        if (team == null) return null
        return team.lunchBreakEnd ?: findInheritedEnd(team.parentTeam)
    }

}

fun Instant?.until(duration: Temporal): Duration {
    return this?.let { Duration.between(this, duration) } ?: Duration.ZERO
}