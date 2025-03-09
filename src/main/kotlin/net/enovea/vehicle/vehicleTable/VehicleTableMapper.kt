package net.enovea.vehicle.vehicleTable

import net.enovea.device.deviceData.DeviceDataDTO
import net.enovea.device.deviceData.DeviceDataMapper
import net.enovea.device.deviceData.DeviceDataStateMapper
import net.enovea.device.DeviceMapper
import net.enovea.driver.DriverMapper
import net.enovea.team.TeamMapper
import net.enovea.team.TeamDTO
import net.enovea.device.deviceVehicle.DeviceVehicleInstallEntity
import net.enovea.vehicle.VehicleEntity
import net.enovea.vehicle.VehicleMapper
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import org.mapstruct.Context
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers
import java.sql.Timestamp
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@Mapper( componentModel = "cdi", uses = [DriverMapper::class , DeviceMapper::class , TeamMapper::class , VehicleMapper::class, DeviceDataStateMapper::class  ])
abstract class VehicleTableMapper {

    @Inject
    protected lateinit var vehicleService: VehicleService

    @Inject
    protected lateinit var driverService: DriverService

    @Mapping(target = "id", source = "id")
    @Mapping(target = "licenseplate", source = "licenseplate")
    @Mapping(source = "category",target = "category")
    @Mapping(target = "driver", expression = "java(vehicleMapper.mapMostRecentDriver(vehicleEntity.retrieveVehicleDrivers()))")
    @Mapping(source ="vehicleDevices",target = "device")
    @Mapping(source ="vehicleTeams",target = "team")
    @Mapping(source =".",target = "lastPositionDate", qualifiedByName = ["lastPositionDateMapperInTable"])
    @Mapping(source = ".", target = "ranges", qualifiedByName = ["mapVehicleRangesVTDTO"])
    abstract fun toVehicleTableDTO(vehicleEntity: VehicleEntity,
                          @Context vehicleMapper: VehicleMapper): VehicleTableDTO

    //Map most recent Device to DeviceDataDTO
    fun mapRecentDevice(vehicleDevices: List<DeviceVehicleInstallEntity>): DeviceDataDTO? {
        return vehicleDevices
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { DeviceDataMapper.INSTANCE.toDto(it.device!!) }
    }

    //Map the most recent team to TeamDTO
    fun mapRecentTeam(vehicleTeams: List<VehicleTeamEntity>): TeamDTO? {
        return vehicleTeams
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { TeamMapper.INSTANCE.toDto(it.team!!) }
    }

    //region  Common function

    @Named("lastPositionDateMapperInTable")
    fun mapLastPositionDateInTable(vehicleEntity: VehicleEntity): Timestamp? {
        val deviceEntity = VehicleEntity.getCurrentDevice(vehicleEntity.vehicleDevices)
        return if (deviceEntity == null) {
            null
        } else {
            deviceEntity.deviceDataState?.lastPositionTime
        }
    }

    @Named("mapVehicleRangesVTDTO")
    fun mapVehicleRangesVDTO(vehicleEntity: VehicleEntity): List<Range<VehicleTableDTO>>? {
        // 1. Récupérer la liste de drivers éventuellement associés au même "vehicule"
        //    -> Au choix : soit on utilise vehicleEntity.vehicleDrivers.map { it.driver },
        //       soit on a un utilitaire.
        val drivers = vehicleEntity.vehicleDrivers.mapNotNull { it.driver }

        // 2. On met le vehicule lui-même dans une liste
        val vehicles = listOf(vehicleEntity)

        // 3. On choisit la date de référence
        val refDate = Timestamp(System.currentTimeMillis())

        // 4. On calcule la fenêtre globale de pause
        val (earliestStart, latestEnd) = computeFinalLunchBreakWindow(vehicles, drivers, refDate)

        // 5. S’il n’y a pas de plage (earliestStart ou latestEnd null), on renvoie null
        if (earliestStart == null || latestEnd == null) {
            return null
        }

        // 6. Construire la description : "pause déjeuner de 12:00 à 13:00", par ex.
        val description = "pause déjeuner de $earliestStart à $latestEnd"

        // 7. Créer notre Range<VehicleDTO> unique
        val lunchBreakRange = Range<VehicleTableDTO>(
            label       = "LUNCH_BREAK",
            description = description,
            range       = TimestampRange(
                start = Timestamp.valueOf(LocalDateTime.of(LocalDate.now(), earliestStart)),
                end   = Timestamp.valueOf(LocalDateTime.of(LocalDate.now(), latestEnd))
            ),
            transform = { t -> t } // transformation identité
        )
        return listOf(lunchBreakRange)
    }

    //endregion

    private fun computeFinalLunchBreakWindow(vehicles: List<VehicleEntity>, drivers: List<DriverEntity>, refDate: Timestamp): Pair<LocalTime?, LocalTime?> {
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
}
