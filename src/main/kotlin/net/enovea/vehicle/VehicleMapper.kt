package net.enovea.vehicle

import jakarta.inject.Inject
import net.enovea.device.*
import net.enovea.device.deviceData.DeviceDataDTO
import net.enovea.device.deviceData.DeviceDataMapper
import net.enovea.device.deviceData.DeviceDataStateMapper
import net.enovea.device.deviceVehicle.DeviceVehicleInstallEntity
import net.enovea.driver.DriverDTO
import net.enovea.driver.DriverEntity
import net.enovea.driver.DriverMapper
import net.enovea.driver.DriverService
import net.enovea.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import net.enovea.poi.PointOfInterestEntity
import net.enovea.spatial.GeoCodingService
import net.enovea.spatial.SpatialService
import net.enovea.team.*
import net.enovea.vehicle.vehicle_category.VehicleCategoryMapper
import net.enovea.vehicle.vehicleDriver.VehicleDriverEntity
import net.enovea.vehicle.vehicleTable.VehicleTableDTO
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import net.enovea.workInProgress.RangedDTO
import org.locationtech.jts.geom.Point
import org.mapstruct.*
import java.sql.Timestamp
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import org.mapstruct.Context
import java.time.ZonedDateTime

@Mapper(componentModel = "cdi")
abstract class VehicleMapper {

    @Inject
    protected lateinit var vehicleService: VehicleService

    @Inject
    protected lateinit var driverService: DriverService

    @Inject
    protected lateinit var driverMapper: DriverMapper

    @Inject
    protected lateinit var deviceMapper: DeviceMapper

    @Inject
    protected lateinit var deviceSummaryMapper: DeviceSummaryMapper

    @Inject
    protected lateinit var teamMapper: TeamMapper

    @Inject
    protected lateinit var teamSummaryMapper: TeamSummaryMapper

    @Inject
    protected lateinit var deviceDataStateMapper: DeviceDataStateMapper

    @Inject
    protected lateinit var spatialService: SpatialService

    @Inject
    protected lateinit var deviceDataMapper: DeviceDataMapper

    @Inject
    protected lateinit var geoCodingService: GeoCodingService

    //////////////////////////
    // Vehicle Summary Mapper
    //////////////////////////
    @Mapping(target = "driver", expression = "java(mapDriverAtDate(vehicleEntity, dateParam))")
    @Mapping(target = "device", expression = "java(mapDeviceAtDate(vehicleEntity, dateParam))")
    @Mapping(target = "team", expression = "java(mapTeamAtDate(vehicleEntity, dateParam))")
    @Mapping(source =".",target = "lastPositionDate", qualifiedByName = ["lastPositionDateMapper"])
    @Mapping(source = ".", target = "ranges", qualifiedByName = ["mapVehicleRangesVSDTO"])
    abstract fun toVehicleDTOSummary(vehicleEntity: VehicleEntity, @Context dateParam: Timestamp? = null): VehicleSummaryDTO

    //Map VehicleDrivers to most recent (active) DriverDTO
    fun mapDriverAtDate(vehicle: VehicleEntity, dateParam: Timestamp? = null): DriverDTO? {
        val effectiveDate = dateParam ?: Timestamp(System.currentTimeMillis())
        return vehicle.vehicleDrivers
            .filter {
                // startDate <= effectiveDate
                it.id.startDate <= effectiveDate &&
                        // endDate == null ou endDate >= effectiveDate
                        (it.endDate == null || it.endDate!! >= effectiveDate)
            }
            .maxByOrNull { it.id.startDate }
            ?.let { driverMapper.toDto(it.driver!!) }
    }

    //Map DeviceVehicleInstallEntity to most recent (active) DeviceSummaryDTO
    fun mapDeviceAtDate(vehicle: VehicleEntity, dateParam: Timestamp? = null): DeviceSummaryDTO? {
        val effectiveDate = dateParam ?: Timestamp(System.currentTimeMillis())
        return vehicle.vehicleDevices
            .filter {
                it.id.startDate <= effectiveDate &&
                        (it.endDate == null || it.endDate!! >= effectiveDate)
            }
            .maxByOrNull { it.id.startDate }
            ?.let { deviceSummaryMapper.toDeviceDTOsummary(it.device!!) }
    }

    //Map VehicleTeamEntity to most recent (active) TeamSummaryDTO
    fun mapTeamAtDate(vehicle: VehicleEntity, dateParam: Timestamp? = null): TeamSummaryDTO? {
        val effectiveDate = dateParam ?: Timestamp(System.currentTimeMillis())
        return vehicle.vehicleTeams
            .filter {
                it.id.startDate <= effectiveDate &&
                        (it.endDate == null || it.endDate!! >= effectiveDate)
            }
            .maxByOrNull { it.id.startDate }
            ?.let { teamSummaryMapper.toDto(it.team!!) }
    }

    //Map VehicleTeamEntity to most recent (active) TeamSummaryDTO
    fun mapTeamSummaryAtDate(vehicle: VehicleEntity, dateParam: Timestamp? = null): TeamDTO? {
        val effectiveDate = dateParam ?: Timestamp(System.currentTimeMillis())
        return vehicle.vehicleTeams
            .filter {
                it.id.startDate <= effectiveDate &&
                        (it.endDate == null || it.endDate!! >= effectiveDate)
            }
            .maxByOrNull { it.id.startDate }
            ?.let { teamMapper.toDto(it.team!!) }
    }

    //Map DeviceVehicleInstallEntity to most recent (active) DeviceSummaryDTO
    fun mapDeviceDataDTOAtDate(vehicle: VehicleEntity, dateParam: Timestamp? = null): DeviceDataDTO? {
        val effectiveDate = dateParam ?: Timestamp(System.currentTimeMillis())
        return vehicle.vehicleDevices
            .filter {
                it.id.startDate <= effectiveDate &&
                        (it.endDate == null || it.endDate!! >= effectiveDate)
            }
            .maxByOrNull { it.id.startDate }
            ?.let { deviceDataMapper.toDto(it.device!!) }
    }

    //////////////////////////
    // Vehicle Mapper
    //////////////////////////
    @Mapping(source = "vehicleDrivers", target = "drivers")
    @Mapping(source = "vehicleDevices", target = "devices")
    @Mapping(source = "vehicleTeams", target = "teams")
    @Mapping(source = "category", target = "category")
    @Mapping(source =".",target = "lastPositionDate", qualifiedByName = ["lastPositionDateMapper"])
    @Mapping(source = ".", target = "ranges", qualifiedByName = ["mapVehicleRangesVDTO"])
    abstract fun toVehicleDTO(vehicle: VehicleEntity): VehicleDTO

    //Map VehicleDriversEntity to DriverDTOs with start and end date
    fun mapVehicleDriversToDriversDTO(vehicleDrivers: List<VehicleDriverEntity>): Map<TimestampRange, DriverDTO> =
        vehicleDrivers.associate {
            val startDate = it.id.startDate
            val endDate = it.endDate
            TimestampRange(startDate, endDate) to driverMapper.toDto(it.driver!!)
        }

    //Map DeviceVehicleInstallEntity to DeviceDTOs with start and end date
    fun mapVehicleDevicesToDevicesDTO(vehicleDevices: List<DeviceVehicleInstallEntity>): Map<TimestampRange, DeviceDTO> =
        vehicleDevices.associate {
            val startDate = it.id.startDate
            val endDate = it.endDate
            TimestampRange(startDate, endDate) to deviceMapper.toDto(it.device!!)
        }

    //Map VehicleTeamEntity to TeamDTOs with start and end date
    fun mapVehicleTeamsToTeamsDTO(vehicleTeams: List<VehicleTeamEntity>): Map<TimestampRange, TeamDTO> =
        vehicleTeams.associate {
            val startDate = it.id.startDate
            val endDate = it.endDate
            TimestampRange(startDate, endDate) to teamMapper.toDto(it.team!!)
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
        val dto = deviceDataStateMapper.toDto(deviceDataState)

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
        val dto = deviceDataStateMapper.toDto(deviceDataState)
        // dto.state sera déjà transformé par le custom mapper @Named("BR_StateMapper")
        return dto.state
    }


    @Mapping(target = "id", source = "id")
    @Mapping(target = "licenseplate", source = "licenseplate")
    @Mapping(source = "category",target = "category")
    @Mapping(target = "driver", expression = "java( mapDriverAtDate(vehicleEntity, null) )")
    @Mapping(target = "device", expression = "java(mapDeviceDataDTOAtDate(vehicleEntity, null))")
    @Mapping(target = "team", expression = "java(mapTeamSummaryAtDate(vehicleEntity, null))")
    @Mapping(source =".",target = "lastPositionDate", qualifiedByName = ["lastPositionDateMapperInTable"])
    @Mapping(source = ".", target = "ranges", qualifiedByName = ["mapVehicleRangesVTDTO"])
    @Mapping(target = "lastPositionAddress", source = ".", qualifiedByName = ["mapLastPositionAddress"])
    @Mapping(target = "lastPositionAddressInfo", source = ".", qualifiedByName = ["mapLastPositionAddressInfo"])
    abstract fun toVehicleTableDTO(vehicleEntity: VehicleEntity): VehicleTableDTO

    // Méthode custom pour mapper l'adresse à partir du POI
    @Named("mapLastPositionAddress")
    fun mapLastPositionAddress(vehicleEntity: VehicleEntity): String? {
        try {
            val deviceEntity = VehicleEntity.getCurrentDevice(vehicleEntity.vehicleDevices)
            val deviceDataState = deviceEntity?.deviceDataState
            // Récupère le POI en utilisant la coordonnée
            val poi = deviceDataState?.coordinate?.let { spatialService.getNearestEntityWithinArea(it, PointOfInterestEntity::class) }
            return if (poi != null) {
                // Si POI trouvé, retourner "client_code - client_label" (avec valeur par défaut)
                (poi.client_code ?: "0000") + " - " + poi.client_label
            } else {
                // Sinon, si aucune adresse dans le deviceDataState, essayer le géocodage inverse
                if (deviceDataState?.address.isNullOrEmpty()) {
                    deviceDataState?.coordinate?.let { geoCodingService.reverseGeocode(it) } ?: "Adresse Inconnue"
                } else {
                    deviceDataState?.address
                }
            }
        } catch (e: Exception) {
            return "Error retrieving location data"
        }
    }

    // Méthode custom pour mapper la catégorie du POI (adresse info)
    @Named("mapLastPositionAddressInfo")
    fun mapLastPositionAddressInfo(vehicleEntity: VehicleEntity): PointOfInterestCategoryEntity? {
        try {
            val deviceEntity = VehicleEntity.getCurrentDevice(vehicleEntity.vehicleDevices)
            val deviceDataState = deviceEntity?.deviceDataState
            val poi = deviceDataState?.coordinate?.let { spatialService.getNearestEntityWithinArea(it, PointOfInterestEntity::class) }
            return poi?.category ?: PointOfInterestCategoryEntity(label = "route", color = "#000")
        } catch (e: Exception) {
            return null
        }
    }

    @Named("mapVehicleRangesVTDTO")
    fun mapVehicleRangesVTDTO(vehicleEntity: VehicleEntity): List<Range<VehicleTableDTO>>? {
        // 1. Récupérer la liste de drivers éventuellement associés au même "vehicule"
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
        val parisZone = ZoneId.of("Europe/Paris")
        val todayInParis = LocalDate.now(parisZone)
        val lunchBreakRange = Range<VehicleTableDTO>(
            label = "LUNCH_BREAK",
            description = description,
            range = TimestampRange(
                start = Timestamp.from(
                    earliestStart.atDate(todayInParis).atZone(parisZone).toInstant()
                ),
                end = Timestamp.from(
                    latestEnd.atDate(todayInParis).atZone(parisZone).toInstant()
                )
            ),
            transform = { dto: VehicleTableDTO ->
                val now = ZonedDateTime.now(ZoneId.of("Europe/Paris"))
                    .toInstant()
                    .let { Timestamp.from(it) }
                // Calcul de la limite : 5 minutes après la fin de la pause déjeuner
                val threshold = Timestamp.from(
                    latestEnd.atDate(todayInParis).atZone(parisZone).toInstant().plus(5, ChronoUnit.MINUTES)
                )
                // Si l'heure actuelle est après cette limite, on conserve le DTO tel quel (pas d'anonymisation)
                if (now.after(threshold)) {
                    return@Range
                }
                // Sinon, anonymisation de la position et de l'adresse
                dto.lastPositionAddress = "Pause déjeuner de $earliestStart à $latestEnd"
                dto.lastPositionAddressInfo = null
                dto.device.deviceDataState?.let { state ->
                    state.coordinate = null
                    state.address = "Pause déjeuner de $earliestStart à $latestEnd"
                }
            }
        )
        return listOf(lunchBreakRange)
    }

    @Named("lastPositionDateMapperInTable")
    fun mapLastPositionDateInTable(vehicleEntity: VehicleEntity): Timestamp? {
        val deviceEntity = VehicleEntity.getCurrentDevice(vehicleEntity.vehicleDevices)
        return if (deviceEntity == null) {
            null
        } else {
            deviceEntity.deviceDataState?.lastPositionTime
        }
    }
    /////////////////////////////////////
    // Common function
    ////////////////////////////////////

    @AfterMapping
    fun <T> applyRangeTransformations(
        @MappingTarget dto: T
    ) where T : RangedDTO<T> {
        dto.lastPositionDate?.let { lastDate ->
            dto.ranges?.forEach { range ->
                if (range.range.contains(lastDate)) {
                    // La lambda de transformation est définie pour modifier le DTO en place.
                    (range.transform)(dto)
                }
            }
        }
    }

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
    //inline fun <reified T : IVehicle<T>> mapVehicleRangesVDTO(vehicleEntity: VehicleEntity): List<Range<T>>? {
        //T::class
    fun mapVehicleRangesVDTO(vehicleEntity: VehicleEntity): List<Range<VehicleDTO>>? {

        // 1. Récupérer la liste de drivers éventuellement associés au même "vehicule"
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
        val parisZone = ZoneId.of("Europe/Paris")
        val todayInParis = LocalDate.now(parisZone)
        //val lunchBreakRange = Range<T>(
        val lunchBreakRange = Range<VehicleDTO>(
            label = "LUNCH_BREAK",
            description = description,
            range = TimestampRange(
                start = Timestamp.from(
                    earliestStart.atDate(todayInParis).atZone(parisZone).toInstant()
                ),
                end = Timestamp.from(
                    latestEnd.atDate(todayInParis).atZone(parisZone).toInstant()
                )
            ),
            transform = { dto ->
                // Si la map des devices n'est pas nulle, on parcourt ses entrées
                dto.devices?.forEach { (_, deviceDto) ->
                    val now = ZonedDateTime.now(ZoneId.of("Europe/Paris"))
                        .toInstant()
                        .let { Timestamp.from(it) }
                    // Calcul de la limite : 5 minutes après la fin de la pause déjeuner
                    val threshold = Timestamp.from(
                        latestEnd.atDate(todayInParis).atZone(parisZone).toInstant().plus(5, ChronoUnit.MINUTES)
                    )
                    // Si l'heure actuelle est après cette limite, on conserve le DTO tel quel (pas d'anonymisation)
                    if (now.after(threshold)) {
                        return@forEach
                    }
                    // On anonymise le deviceDataState en mettant la coordinate à null et en modifiant l'adresse
                    deviceDto.deviceDataState?.apply {
                        coordinate = null
                        address = "pause déjeuner de $earliestStart à $latestEnd"
                    }
                }
            }
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
        val parisZone = ZoneId.of("Europe/Paris")
        val todayInParis = LocalDate.now(parisZone)
        val lunchBreakRange = Range<VehicleSummaryDTO>(
            label = "LUNCH_BREAK",
            description = description,
            range = TimestampRange(
                start = Timestamp.from(
                    earliestStart.atDate(todayInParis).atZone(parisZone).toInstant()
                ),
                end = Timestamp.from(
                    latestEnd.atDate(todayInParis).atZone(parisZone).toInstant()
                )
            ),
            transform = { dto:VehicleSummaryDTO ->
                val now = ZonedDateTime.now(ZoneId.of("Europe/Paris"))
                    .toInstant()
                    .let { Timestamp.from(it) }
                // Calcul de la limite : 5 minutes après la fin de la pause déjeuner
                val threshold = Timestamp.from(
                    latestEnd.atDate(todayInParis).atZone(parisZone).toInstant().plus(5, ChronoUnit.MINUTES)
                )
                // Si l'heure actuelle est après cette limite, on conserve le DTO tel quel (pas d'anonymisation)
                if (now.after(threshold)) {
                    return@Range
                }
                // On vérifie que le device summary possède un DeviceDataState et on l'anonymise
                dto.device?.apply {
                    coordinate = null
                }
            }
        )
        return listOf(lunchBreakRange)
    }

    @Named("mapVehicleRangesVLDTO")
    fun mapVehicleRangesVLDTO(vehicleEntity: VehicleEntity): List<Range<VehicleLocalizationDTO>>? {
        // 1. Récupérer la liste de drivers éventuellement associés au même "vehicule"
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
        val parisZone = ZoneId.of("Europe/Paris")
        val todayInParis = LocalDate.now(parisZone)
        val lunchBreakRange = Range<VehicleLocalizationDTO>(
            label = "LUNCH_BREAK",
            description = description,
            range = TimestampRange(
                start = Timestamp.from(
                    earliestStart.atDate(todayInParis).atZone(parisZone).toInstant()
                ),
                end = Timestamp.from(
                    latestEnd.atDate(todayInParis).atZone(parisZone).toInstant()
                )
            ),
            transform = { dto:VehicleLocalizationDTO ->
                val now = ZonedDateTime.now(ZoneId.of("Europe/Paris"))
                    .toInstant()
                    .let { Timestamp.from(it) }
                // Calcul de la limite : 5 minutes après la fin de la pause déjeuner
                val threshold = Timestamp.from(
                    latestEnd.atDate(todayInParis).atZone(parisZone).toInstant().plus(5, ChronoUnit.MINUTES)
                )
                // Si l'heure actuelle est après cette limite, on conserve le DTO tel quel (pas d'anonymisation)
                if (now.after(threshold)) {
                    return@Range
                }
                dto.lastPosition = null
            }
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
                ?: vehicleService.findInheritedStart(team)
            val finalEnd   = driverService.findInheritedEnd(team)
                ?: vehicleService.findInheritedEnd(team)

            if (finalStart != null && finalEnd != null) Pair(finalStart, finalEnd) else null
        }

        val earliestStart = timeRanges.minByOrNull { it.first }?.first
        val latestEnd     = timeRanges.maxByOrNull { it.second }?.second

        return Pair(earliestStart, latestEnd)
    }

}