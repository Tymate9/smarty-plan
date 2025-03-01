package net.enovea.vehicle.vehicleTable

import jakarta.inject.Inject
import net.enovea.device.deviceData.DeviceDataDTO
import net.enovea.device.deviceData.DeviceDataMapper
import net.enovea.device.deviceData.DeviceDataStateMapper
import net.enovea.device.DeviceMapper
import net.enovea.driver.DriverMapper
import net.enovea.team.TeamMapper
import net.enovea.team.TeamDTO
import net.enovea.device.deviceVehicle.DeviceVehicleInstallEntity
import net.enovea.driver.DriverEntity
import net.enovea.driver.DriverService
import net.enovea.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import net.enovea.poi.PointOfInterestEntity
import net.enovea.spatial.GeoCodingService
import net.enovea.spatial.SpatialService
import net.enovea.team.TeamEntity
import net.enovea.vehicle.*
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import org.mapstruct.*
import org.mapstruct.factory.Mappers
import java.sql.Timestamp
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.temporal.ChronoUnit

@Mapper( componentModel = "cdi", uses = [DriverMapper::class , DeviceMapper::class , TeamMapper::class , VehicleMapper::class, DeviceDataStateMapper::class  ])
abstract class VehicleTableMapper {

    @Inject
    protected lateinit var vehicleService: VehicleService

    @Inject
    protected lateinit var driverService: DriverService

    @Inject
    protected lateinit var deviceDataMapper: DeviceDataMapper

    @Inject
    protected lateinit var teamMapper: TeamMapper

    @Inject
    protected lateinit var spatialService: SpatialService

    @Inject
    protected lateinit var geoCodingService: GeoCodingService

    @Mapping(target = "id", source = "id")
    @Mapping(target = "licenseplate", source = "licenseplate")
    @Mapping(source = "category",target = "category")
    @Mapping(target = "driver", expression = "java(vehicleMapper.mapDriverAtDate(vehicleEntity, null))")
    @Mapping(source ="vehicleDevices",target = "device")
    @Mapping(source ="vehicleTeams",target = "team")
    @Mapping(source =".",target = "lastPositionDate", qualifiedByName = ["lastPositionDateMapperInTable"])
    @Mapping(source = ".", target = "ranges", qualifiedByName = ["mapVehicleRangesVTDTO"])
    @Mapping(target = "lastPositionAddress", source = ".", qualifiedByName = ["mapLastPositionAddress"])
    @Mapping(target = "lastPositionAddressInfo", source = ".", qualifiedByName = ["mapLastPositionAddressInfo"])
    abstract fun toVehicleTableDTO(vehicleEntity: VehicleEntity, @Context vehicleMapper: VehicleMapper): VehicleTableDTO

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

    @AfterMapping
    fun applyRangeTransformations(
        vehicleEntity: VehicleEntity,
        @MappingTarget vehicleTableDTO: VehicleTableDTO
    ) {
        vehicleTableDTO.ranges?.forEach { range ->
            // Vérifie que lastPositionDate est défini et qu'elle se situe dans la plage définie
            if (vehicleTableDTO.lastPositionDate != null && range.range.contains(vehicleTableDTO.lastPositionDate)) {
                // Applique la transformation en modifiant directement le DTO
                range.transform(vehicleTableDTO)
            }
        }
    }

    //Map most recent Device to DeviceDataDTO
    fun mapRecentDevice(vehicleDevices: List<DeviceVehicleInstallEntity>): DeviceDataDTO? {
        return vehicleDevices
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { deviceDataMapper.toDto(it.device!!) }
    }

    //Map the most recent team to TeamDTO
    fun mapRecentTeam(vehicleTeams: List<VehicleTeamEntity>): TeamDTO? {
        return vehicleTeams
            .filter { it.endDate == null }
            .maxByOrNull { it.id.startDate }
            ?.let { teamMapper.toDto(it.team!!) }
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
                val now = Timestamp(System.currentTimeMillis())
                println(now)
                // Calcul de la limite : 5 minutes après la fin de la pause déjeuner
                val threshold = Timestamp.from(
                    latestEnd.atDate(todayInParis).atZone(parisZone).toInstant().plus(5, ChronoUnit.MINUTES)
                )
                println(threshold)
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
