package net.enovea.domain.vehicle

import jakarta.enterprise.inject.spi.CDI
import jakarta.inject.Inject
import net.enovea.domain.device.DeviceDataStateMapper
import net.enovea.domain.device.DeviceMapper
import net.enovea.domain.device.DeviceSummaryMapper
import net.enovea.domain.device.until
import net.enovea.domain.driver.DriverEntity
import net.enovea.domain.driver.DriverMapper
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.team.TeamMapper
import net.enovea.domain.team.TeamSummaryMapper
import net.enovea.domain.vehicle_category.VehicleCategoryMapper
import net.enovea.dto.*
import net.enovea.service.DriverService
import net.enovea.service.VehicleService
import org.locationtech.jts.geom.Point
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Named
import org.mapstruct.factory.Mappers
import java.sql.Timestamp
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@Mapper(componentModel = "cdi" ,uses = [DriverMapper::class , DeviceMapper::class , TeamMapper::class , VehicleCategoryMapper::class, DeviceDataStateMapper::class])
abstract class VehicleMapper {

    @Inject
    protected lateinit var vehicleService: VehicleService

    @Inject
    protected lateinit var driverService: DriverService

    //////////////////////////
    // Vehicle Summary Mapper
    //////////////////////////
    @Mapping(source ="vehicleDrivers",target = "driver")
    @Mapping(source ="vehicleDevices",target = "device")
    @Mapping(source ="vehicleTeams",target = "team")
    @Mapping(source =".",target = "lastPositionDate", qualifiedByName = ["lastPositionDateMapper"])
    @Mapping(source = ".", target = "ranges", qualifiedByName = ["mapVehicleRangesVSDTO"])
    abstract fun toVehicleDTOSummary(vehicleEntity: VehicleEntity): VehicleSummaryDTO

    //Map VehicleDrivers to recent DriverDTO
    fun mapMostRecentDriver(vehicleDrivers: List<VehicleDriverEntity>): DriverDTO? {
        val driverEntity = VehicleEntity.getCurrentDriver(vehicleDrivers)
        return if (driverEntity == null) {
            null
        } else {
            DriverMapper.INSTANCE.toDto(driverEntity)
        }
    }

    //Map most recent Device to DeviceDTOsummary
    fun mapMostRecentDevice(vehicleDevices: List<DeviceVehicleInstallEntity>): DeviceSummaryDTO? {
        val deviceEntity = VehicleEntity.getCurrentDevice(vehicleDevices)
        return if (deviceEntity == null) {
            null
        } else {
            DeviceSummaryMapper.INSTANCE.toDeviceDTOsummary(deviceEntity)
        }
    }

    //Map the most recent team to TeamDTO
    fun mapMostRecentTeam(vehicleTeams: List<VehicleTeamEntity>): TeamSummaryDTO? {
        return vehicleTeams
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { TeamSummaryMapper.INSTANCE.toDto(it.team!!) }
    }

    //////////////////////////
    // Vehicle Mapper
    //////////////////////////
    @Mapping(source = "vehicleDrivers", target = "drivers")
    @Mapping(source = "vehicleDevices", target = "devices")
    @Mapping(source = "vehicleTeams", target = "teams")
    @Mapping(source = "category",target = "category")
    @Mapping(source =".",target = "lastPositionDate", qualifiedByName = ["lastPositionDateMapper"])
    @Mapping(source = ".", target = "ranges", qualifiedByName = ["mapVehicleRangesVDTO"])
    abstract fun toVehicleDTO(vehicle: VehicleEntity): VehicleDTO

    //Map VehicleDriversEntity to DriverDTOs with start and end date
    fun mapVehicleDriversToDriversDTO(vehicleDrivers: List<VehicleDriverEntity>): Map<TimestampRange, DriverDTO> =
        vehicleDrivers.associate {
            val startDate = it.id.startDate
            val endDate = it.endDate
            TimestampRange(startDate, endDate) to DriverMapper.INSTANCE.toDto(it.driver!!)
        }

    //Map DeviceVehicleInstallEntity to DeviceDTOs with start and end date
    fun mapVehicleDevicesToDevicesDTO(vehicleDevices: List<DeviceVehicleInstallEntity>):Map<TimestampRange, DeviceDTO> =
        vehicleDevices.associate {
            val startDate = it.id.startDate
            val endDate = it.endDate
            TimestampRange(startDate, endDate) to DeviceMapper.INSTANCE.toDto(it.device!!)
        }

    //Map VehicleTeamEntity to TeamDTOs with start and end date
    fun mapVehicleTeamsToTeamsDTO(vehicleTeams: List<VehicleTeamEntity>):Map<TimestampRange, TeamDTO> =
        vehicleTeams.associate {
            val startDate = it.id.startDate
            val endDate = it.endDate
            TimestampRange(startDate, endDate) to TeamMapper.INSTANCE.toDto(it.team!!)
        }

    //////////////////////////
    // Vehicle Localization
    //////////////////////////
    @Mapping(target = "lastPosition", source = "vehicleDevices", qualifiedByName = ["localizationLastPositionMapper"])
    @Mapping(target = "state", source = "vehicleDevices", qualifiedByName = ["localizationStateMapper"])
    @Mapping(source =".",target = "lastPositionDate", qualifiedByName = ["lastPositionDateMapper"])
    @Mapping(source = ".", target = "ranges", qualifiedByName = ["mapVehicleRangesVLDTO"])
    abstract fun toVehicleLocalizationDTO(vehicle: VehicleEntity): VehicleLocalizationDTO

    @Named("localizationLastPositionMapper")
    fun localizationLastPositionMapper(vehicleDevices: List<DeviceVehicleInstallEntity>): Point? {
        val deviceDataState = vehicleDevices
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.device
            ?.deviceDataState

        if (deviceDataState == null) {
            return null
        }

        // On applique le mapper DeviceDataStateMapper
        val dto = CDI.current().select(DeviceDataStateMapper::class.java).get().toDto(deviceDataState)

        // dto.coordinate sera déjà anonymisé si la pause est en cours
        return dto.coordinate
    }

    @Named("localizationStateMapper")
    fun localizationStateMapper(vehicleDevices: List<DeviceVehicleInstallEntity>): String? {
        val deviceDataState = vehicleDevices
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.device
            ?.deviceDataState

        if (deviceDataState == null) {
            return null
        }

        // On applique le mapper
        val dto = CDI.current().select(DeviceDataStateMapper::class.java).get().toDto(deviceDataState)
        // dto.state sera déjà transformé par le custom mapper @Named("BR_StateMapper")
        return dto.state
    }


    /////////////////////////////////////
    // Common function
    ////////////////////////////////////

    @Named("lastPositionDateMapper")
    fun mapLastPositionDate(vehicleEntity: VehicleEntity): Timestamp? {
        val deviceEntity = VehicleEntity.getCurrentDevice(vehicleEntity.vehicleDevices)
        return if (deviceEntity == null) {
            null
        } else {
            deviceEntity.deviceDataState?.lastPositionTime
        }
    }

    @Named("mapVehicleRangesVDTO")
    fun mapVehicleRangesVDTO(vehicleEntity: VehicleEntity): List<Range<VehicleDTO>>? {
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
        val lunchBreakRange = Range<VehicleDTO>(
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

    @Named("mapVehicleRangesVSDTO")
    fun mapVehicleRangesVSDTO(vehicleEntity: VehicleEntity): List<Range<VehicleSummaryDTO>>? {
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
        val lunchBreakRange = Range<VehicleSummaryDTO>(
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

    @Named("mapVehicleRangesVLDTO")
    fun mapVehicleRangesVLDTO(vehicleEntity: VehicleEntity): List<Range<VehicleLocalizationDTO>>? {
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
        val lunchBreakRange = Range<VehicleLocalizationDTO>(
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

