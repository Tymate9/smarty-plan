package net.enovea.device.deviceData

import net.enovea.device.DeviceEntity
import net.enovea.driver.DriverEntity
import net.enovea.team.TeamEntity
import net.enovea.vehicle.VehicleEntity
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

//TODO ça c'est vraiment dégueu mais en l'absence d'une homogénéité au sein de l'utilisation de nos mapper je dois le conserver pour pouvoir continuer à l'utiliser.
// Il ne faut plus passer par l'instance à partir de maintenant mais systématiquement passer par l'injection de dépendance sinon on ne peux plus se charger des cas complexe.
@Unremovable
@Mapper(componentModel = "cdi")
abstract class DeviceDataStateMapper ()
{
    @Inject
    protected lateinit var vehicleService: VehicleService

    @Inject
    protected lateinit var driverService: DriverService

    @Mapping(source=".", target = "state", qualifiedByName = ["BR_StateMapper"])
    @Mapping(source = ".", target = "coordinate", qualifiedByName = ["BR_LunchBreakPositionMapper"])
    @Mapping(source = ".", target = "address", qualifiedByName = ["BR_LunchBreakAddressMapper"])
    abstract fun toDto(deviceDataState: DeviceDataStateEntity): DeviceDataStateDTO

    abstract fun toEntity(deviceDataStateDTO: DeviceDataStateDTO): DeviceDataStateEntity

    @Named("BR_StateMapper")
    fun StateMapper(deviceDataState: DeviceDataStateEntity) : String? {
        return if(deviceDataState.lastCommTime?.toInstant().until(Instant.now()).toHours() >= 12) {
            "NO_COM"
        }else {
            deviceDataState.state
        }
    }

/*    companion object {
        val INSTANCE: DeviceDataStateMapper = Mappers.getMapper(DeviceDataStateMapper::class.java)
    }*/

    @Named("BR_LunchBreakPositionMapper")
    fun mapPositionDuringLunchBreak(entity: DeviceDataStateEntity): Point? {
        val referenceDate = Timestamp(System.currentTimeMillis())

        val (vehicles, drivers) = DeviceEntity.findVehiclesAndDriversActiveAt(entity.device_id, referenceDate)

        // On conserve computeFinalLunchBreakWindow ici
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

        // Idem, on appelle computeFinalLunchBreakWindow
        val (earliestStart, latestEnd) = computeFinalLunchBreakWindow(vehicles, drivers, referenceDate)

        return if (isInPause(entity.lastPositionTime, earliestStart, latestEnd)) {
            val startStr = earliestStart?.toString() ?: "??:??"
            val endStr   = latestEnd?.toString()   ?: "??:??"
            "pause déjeuner de $startStr à $endStr"
        } else {
            entity.address
        }
    }

    //TODO(Ces fonctionnalités doivent être déplacés)

    /**
     * Vérifie si [lastPositionTime] tombe dans l’intervalle [earliestStart, latestEnd].
     */
    private fun isInPause(
        lastPositionTime: Timestamp?,
        earliestStart: LocalTime?,
        latestEnd: LocalTime?
    ): Boolean {
        if (lastPositionTime == null || earliestStart == null || latestEnd == null) return false
        val localTime = lastPositionTime.toInstant()
            .atZone(ZoneId.of("Europe/Paris"))
            .toLocalTime()

        return !localTime.isBefore(earliestStart) && !localTime.isAfter(latestEnd)
    }

    /**
     * Calcule la fenêtre de pause "globale" en combinant drivers + vehicles.
     * (On la laisse pour le moment ici, même si l’idéal est de la déplacer plus tard dans un service.)
     */
    private fun computeFinalLunchBreakWindow(
        vehicles: List<VehicleEntity>,
        drivers: List<DriverEntity>,
        refDate: Timestamp
    ): Pair<LocalTime?, LocalTime?> {
        // 1. Récupérer toutes les teams (driver + vehicle)
        val allTeams = mutableSetOf<TeamEntity>()

        // On appelle désormais les services pour trouver les teams actives
        drivers.forEach { driver ->
            val activeDriverTeams = driverService.findActiveDriverTeams(driver, refDate)
            allTeams.addAll(activeDriverTeams)
        }

        vehicles.forEach { vehicle ->
            val activeVehicleTeams = vehicleService.findActiveVehicleTeams(vehicle, refDate)
            allTeams.addAll(activeVehicleTeams)
        }

        // 2. On applique l’héritage via les services
        val timeRanges = allTeams.mapNotNull { team ->
            val finalStart = driverService.findInheritedStart(team)
                ?: vehicleService.findInheritedStart(team)  // si vous préférez prioriser le driverService ou vice versa
            val finalEnd   = driverService.findInheritedEnd(team)
                ?: vehicleService.findInheritedEnd(team)

            if (finalStart != null && finalEnd != null) Pair(finalStart, finalEnd) else null
        }

        val earliestStart = timeRanges.minByOrNull { it.first }?.first
        val latestEnd     = timeRanges.maxByOrNull { it.second }?.second

        return Pair(earliestStart, latestEnd)
    }

    fun Instant?.until(duration: Temporal): Duration {
        return this?.let { Duration.between(it, duration) } ?: Duration.ZERO
    }

}


fun Instant?.until(duration: Temporal): Duration {
    return this?.let { Duration.between(this, duration) } ?: Duration.ZERO
}