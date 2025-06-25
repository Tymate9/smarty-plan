package net.enovea.vehicle

import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import jakarta.ws.rs.BadRequestException
import jakarta.ws.rs.NotFoundException
import net.dilivia.lang.StopWatch
import net.enovea.commons.Stat
import net.enovea.commons.StatsDTO
import net.enovea.device.deviceVehicle.DeviceVehicleInstallEntity
import net.enovea.driver.driverUntrackedPeriod.DriverUntrackedPeriodEntity
import net.enovea.trip.TripService
import net.enovea.team.TeamDTO
import net.enovea.team.TeamEntity
import net.enovea.team.TeamMapper
import net.enovea.vehicle.vehicleStats.*
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import net.enovea.vehicle.vehicleUntrackedPeriod.VehicleUntrackedPeriodEntity
import net.enovea.vehicle.vehicle_category.VehicleCategoryEntity
import net.enovea.commons.ICRUDService
import java.sql.Timestamp
import java.time.*
import java.time.temporal.Temporal
import kotlin.math.roundToInt
import kotlin.math.round

open class VehicleService(
    private val vehicleMapper: VehicleMapper,
    private val entityManager: EntityManager,
    private val tripService: TripService,
    private val vehicleStatsRepository: VehicleStatsRepository,
    private val teamMapper: TeamMapper
) : ICRUDService<VehicleForm, VehicleDTO, String> {

    @Transactional
    override fun getById(id: String): VehicleDTO {
        val entity = VehicleEntity.findById(id)
            ?: throw NotFoundException("Vehicle with id=$id not found")
        return vehicleMapper.toVehicleDTO(entity)
    }

    @Transactional
    override fun create(form: VehicleForm): VehicleDTO {
        val entity = VehicleEntity().apply {
            energy = form.energy
            engine = form.engine
            externalId = form.externalid
            licenseplate = form.licenseplate
            // Récupérer la catégorie à partir de l'id fourni
            category = VehicleCategoryEntity.findById(form.category!!)
                ?: throw NotFoundException("Vehicle category with id=${form.category} not found")
            validated = form.validated
        }
        entity.persistAndFlush()
        return vehicleMapper.toVehicleDTO(entity)
    }

    @Transactional
    override fun update(form: VehicleForm): VehicleDTO {
        val id = form.id ?: throw BadRequestException("Id not provided")
        val entity = VehicleEntity.findById(id)
            ?: throw NotFoundException("Vehicle with id=$id not found")
        // Mise à jour des champs
        entity.energy = form.energy
        entity.engine = form.engine
        entity.externalId = form.externalid
        entity.licenseplate = form.licenseplate
        // Mise à jour de la catégorie via son id
        val categoryEntity = VehicleCategoryEntity.findById(form.category!!)
            ?: throw NotFoundException("Vehicle category with id=${form.category} not found")
        entity.category = categoryEntity
        entity.validated = form.validated
        entity.mileage = form.mileage
        entity.serviceDate = form.serviceDate
        entity.theoreticalConsumption = form.theoreticalConsumption

        entity.persistAndFlush()
        return vehicleMapper.toVehicleDTO(entity)
    }


    override fun delete(id: String): VehicleDTO {
        val entity = VehicleEntity.findById(id)
            ?: throw NotFoundException("Vehicle with id=$id not found")
        val dto = vehicleMapper.toVehicleDTO(entity)

        // TODO(trouver un moyen ici pour supprimer l'entité sans être obliger de passer par l'entityManager)
        val query = entityManager.createNativeQuery("DELETE FROM vehicle WHERE id = ?")
        query.setParameter(1, id)
        query.executeUpdate()

        return dto
    }

    //function returns trips statistics displayed on the page ('suivi d'activité')
    fun getVehiclesStatsOverPeriod(startDate: String, endDate: String , teamLabels: List<String>? ,vehicleIds :List<String>?, driversIds: List<String>? , vehiclesType: String): Pair<List<TeamHierarchyNode>, Map<String, Any>>? {

        //choose the doris view depending on the vehiclesType (all, tracked or untracked)
        println(vehiclesType)
        val dorisView = getDorisView(vehiclesType)
        println(dorisView)

        val vehiclesStats = vehicleStatsRepository.findVehicleStatsOverSpecificPeriod(startDate, endDate ,teamLabels ,vehicleIds, driversIds ,dorisView )

        val totalVehiclesStatsMap = calculateTotalVehiclesStats(vehiclesStats)
        val latestTeams: Map<String, TeamDTO> = VehicleTeamEntity.getLatestTeams().mapValues { teamMapper.toDto(it.value) }

        val vehiclesWithHierarchy = vehiclesStats?.map { stats ->

            // Fetch the team using the vehicleId
            val team = stats.vehicleId?.let { latestTeams[it] }

            // Build the team hierarchy
            val teamHierarchy = buildTeamHierarchy(team)

            // Create a new instance of VehicleStatsDTO with enriched information
            val vehicleStatsDTO=VehicleStatsDTO(
                tripDate = stats.tripDate,
                vehicleId = stats.vehicleId,
                tripCount = stats.tripCount,
                distanceSum = stats.distanceSum,
                drivingTime = stats.drivingTime,
                distancePerTripAvg = stats.distancePerTripAvg,
                durationPerTripAvg = stats.durationPerTripAvg,
                hasLateStartSum = stats.hasLateStartSum,
                hasLateStop = stats.hasLateStop,
                hasLastTripLong = stats.hasLastTripLong,
                rangeAvg = stats.rangeAvg,
                waitingDuration = stats.waitingDuration,
                licensePlate = stats.licensePlate,
                driverName = stats.driverName,
            )
            VehiclesStatsDTO(
                vehicleStats = vehicleStatsDTO,
                team = team,
                teamHierarchy = teamHierarchy
            )
        }
        val teamHierarchy = buildTeamHierarchyForest(vehiclesWithHierarchy ?: emptyList()) { it.teamHierarchy }
        return Pair(teamHierarchy, totalVehiclesStatsMap)
    }


    //function to calculate total statistics(indicators) displayed on the page('suivi d'activité')
    private fun calculateTotalVehiclesStats(vehiclesStats: List<VehicleStatsDTO>): Map<String, Any> {

        val totalVehicles = vehiclesStats.size
        val totalDrivers = vehiclesStats.count { !it.driverName.isNullOrEmpty() }
        val totalDistance = vehiclesStats.sumOf { it.distanceSum ?: 0 }
        val totalTripCount = vehiclesStats.sumOf { it.tripCount }
        val totalDrivingTime = String.format("%02d:%02d", (vehiclesStats.sumOf { convertHHMMToSeconds(it.drivingTime) } / 3600), ((vehiclesStats.sumOf { convertHHMMToSeconds(it.drivingTime) } % 3600) / 60))
        val averageDistance = if (totalTripCount > 0) round((totalDistance / totalTripCount).toDouble()) else 0
        val averageDuration = if (totalTripCount > 0) String.format("%02d:%02d", (vehiclesStats.sumOf { convertHHMMToSeconds(it.drivingTime) }.toDouble() / totalTripCount).roundToInt() / 3600, ((vehiclesStats.sumOf { convertHHMMToSeconds(it.drivingTime) }.toDouble() / totalTripCount).roundToInt() % 3600) / 60) else "00:00"
        val totalWaitingTime = String.format("%02d:%02d", (vehiclesStats.sumOf { convertHHMMToSeconds(it.waitingDuration) } / 3600), (vehiclesStats.sumOf { convertHHMMToSeconds(it.waitingDuration) } % 3600) / 60)
        val totalHasLateStart = vehiclesStats.sumOf { it.hasLateStartSum }
        val totalHasLateStop = vehiclesStats.sumOf { it.hasLateStop }
        val totalHasLastTripLong = vehiclesStats.sumOf { it.hasLastTripLong }
        val averageRangeAvg = String.format("%02d:%02d", (vehiclesStats.map { convertHHMMToSeconds(it.rangeAvg) }.average().toInt() / 3600), (vehiclesStats.map { convertHHMMToSeconds(it.rangeAvg) }.average().toInt() % 3600)/ 60)

        // Return results as a map
        return mapOf(
            "totalVehicles" to totalVehicles,
            "totalDrivers" to totalDrivers,
            "totalDistanceSum" to totalDistance,
            "totalTripCount" to totalTripCount,
            "totalDrivingTime" to totalDrivingTime,
            "averageDistance" to averageDistance,
            "averageDuration" to averageDuration,
            "totalWaitingTime" to totalWaitingTime,
            "totalHasLateStartSum" to totalHasLateStart,
            "totalHasLateStop" to totalHasLateStop,
            "totalHasLastTripLong" to totalHasLastTripLong,
            "averageRangeAvg" to averageRangeAvg
        )
    }


    //function to get the daily statistics of a vehicle over a period
    fun getVehicleStatsDaily(startDate: String, endDate: String , vehicleId: String, vehiclesType: String): List<VehicleStatsDTO>{
        val dorisView = getDorisView(vehiclesType)
        return  vehicleStatsRepository.findVehicleDailyStats(startDate,endDate,vehicleId,dorisView)
    }

    //function returns vehicles statistics displayed on the page ('QSE  reports')
    fun getVehiclesStatsQSEReport(startDate: String, endDate: String , teamLabels: List<String>? ,vehicleIds :List<String>?, driversIds: List<String>?, vehiclesType: String): Pair<List<TeamHierarchyNode>, Map<String, Any>>? {

        val dorisView = getDorisView(vehiclesType)
        val vehiclesStatsQse = vehicleStatsRepository.findVehicleStatsQSEOverSpecificPeriod(startDate, endDate ,teamLabels ,vehicleIds, driversIds , dorisView )

        val totalVehiclesStatsQSEMap = calculateTotalVehiclesStatsQSE(vehiclesStatsQse)
        val latestTeams: Map<String, TeamDTO> = VehicleTeamEntity.getLatestTeams().mapValues { teamMapper.toDto(it.value) }

        val vehiclesWithHierarchy = vehiclesStatsQse?.map { stats ->

            // Fetch the team using the vehicleId
            val team = stats.vehicleId?.let { latestTeams[it] }

            // Build the team hierarchy
            val teamHierarchy = buildTeamHierarchy(team)

            // Create a new instance of VehicleStatsQseDTO with enriched information
            val vehicleStatsQseDTO=VehicleStatsQseDTO(
                tripDate = stats.tripDate,
                vehicleId = stats.vehicleId,
                distanceSum = stats.distanceSum,
                durationPerTripAvg = stats.durationPerTripAvg,
                licensePlate = stats.licensePlate,
                driverName = stats.driverName,
                tripCount = stats.tripCount,
                waitingDuration = stats.waitingDuration,
                drivingTime = stats.drivingTime,
                rangeAvg = stats.rangeAvg,
                idleDuration = stats.idleDuration,
                distanceMax = stats.distanceMax
                )
            VehiclesStatsQseDTO(
                vehicleStatsQse = vehicleStatsQseDTO,
                team = team,
                teamHierarchy = teamHierarchy
            )
        }
        val teamHierarchy = buildTeamHierarchyForest(vehiclesWithHierarchy ?: emptyList()) { it.teamHierarchy }
        return Pair(teamHierarchy, totalVehiclesStatsQSEMap)
    }

    //function to calculate total statistics(indicators) displayed on the page('QSE Reports')
    private fun calculateTotalVehiclesStatsQSE(vehiclesStats: List<VehicleStatsQseDTO>): Map<String, Any> {
        val totalDistance = vehiclesStats.sumOf { it.distanceSum ?: 0 }
        val totalDrivingTime = String.format(
            "%02d:%02d",
            (vehiclesStats.sumOf { convertHHMMToSeconds(it.drivingTime) } / 3600),
            ((vehiclesStats.sumOf { convertHHMMToSeconds(it.drivingTime) } % 3600) / 60))
        val totalWaitingTime = String.format(
            "%02d:%02d",
            (vehiclesStats.sumOf { convertHHMMToSeconds(it.waitingDuration) } / 3600),
            (vehiclesStats.sumOf { convertHHMMToSeconds(it.waitingDuration) } % 3600) / 60)
        val averageRangeAvg = String.format("%02d:%02d", (vehiclesStats.map { convertHHMMToSeconds(it.rangeAvg) }.average().toInt() / 3600), (vehiclesStats.map { convertHHMMToSeconds(it.rangeAvg) }.average().toInt() % 3600)/ 60)
        val idleDurationTotal = String.format(
            "%02d:%02d",
            (vehiclesStats.sumOf { convertHHMMToSeconds(it.idleDuration) } / 3600),
            (vehiclesStats.sumOf { convertHHMMToSeconds(it.idleDuration) } % 3600) / 60)
        val longestTrip=vehiclesStats.maxOf { it.distanceMax ?:0 }
        val selectionScore = "A"
        val severityOfUseTurn = "B"
        val severityOfAcceleration ="C"

        return mapOf(
            "totalDistanceSum" to totalDistance,
            "totalDrivingTime" to totalDrivingTime,
            "totalWaitingTime" to totalWaitingTime,
            "selectionScore" to selectionScore,
            "severityOfUseTurn" to severityOfUseTurn,
            "severityOfAcceleration" to severityOfAcceleration,
            "averageRangeAvg" to averageRangeAvg,
            "idleDurationTotal" to idleDurationTotal,
            "longestTrip" to longestTrip
        )
    }


    fun filterVehicle(vehicles: List<VehicleEntity>): List<VehicleEntity> {
        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = VehicleUntrackedPeriodEntity.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = DriverUntrackedPeriodEntity.findDriverIdsWithUntrackedPeriod()

        val trackedVehicles = vehicles.filter { vehicle ->
            val isVehicleTracked = vehicle.id !in untrackedVehicleIds

            // Get the most recent driver's ID where end_date is null
            val recentDriverId: Int? = vehicle.vehicleDrivers
                .filter { it.endDate == null }
                .maxByOrNull { it.id.startDate }
                ?.id?.driverId

            val isDriverTracked = recentDriverId == null || recentDriverId !in untrackedDriverIds

            // Only keep vehicles that are tracked along with their most recent driver
            isVehicleTracked && isDriverTracked
        }
        return trackedVehicles
    }

    //function returns tracked and untracked vehicles(summary) with replacing the last position by null for untracked vehicles/drivers
    fun removeLocalizationToUntrackedVehicle(vehicles: List<VehicleEntity> = VehicleEntity.listAll()): List<VehicleEntity> {
        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = VehicleUntrackedPeriodEntity.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = DriverUntrackedPeriodEntity.findDriverIdsWithUntrackedPeriod()
        return vehicles.map { vehicle ->
            if (vehicle.id in untrackedVehicleIds || VehicleEntity.getCurrentDriver(vehicle.vehicleDrivers)?.id in untrackedDriverIds) {
                VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.also { entityManager.detach(it) }
                VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.coordinate = null
                if (VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.lastCommTime?.toInstant()
                        .until(Instant.now()).toHours() >= 12
                ) {
                    VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.state = "NO_COM"
                }
            } else {
                VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.also { entityManager.detach(it) }
                if (VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.lastCommTime?.toInstant()
                        .until(Instant.now()).toHours() >= 12
                ) {
                    VehicleEntity.getCurrentDevice(vehicle.vehicleDevices)?.deviceDataState?.state = "NO_COM"
                }
            }
            vehicle
        }
    }

    // TODO(Move trip Daily stats to mapper we need to keep DTO initialization logic in the mapstruct mapper)
    fun getVehiclesTableData(vehicles: List<VehicleEntity>? = null, stopWatch: StopWatch? = null): List<TeamHierarchyNode> {
        stopWatch?.start("filter localized vehicles")
        val allVehicles = vehicles ?: VehicleEntity.listAll()
        stopWatch?.stopAndStart("compute daily stats")
        val tripStats = tripService.getTripDailyStats()


        // Map VehicleEntities to VehicleDTOs and enrich with trip statistics
        stopWatch?.stopAndStart("MapTo vehicle data DTO")
        val allVehicleDataDTO =
            allVehicles.filter { it.vehicleDevices.isNotEmpty() && it.vehicleTeams.isNotEmpty() }
                .map { vehicle ->
                    // Convert to VehicleTableDTO
                    val vehicleDTO = vehicleMapper.toVehicleTableDTO(vehicle)

                    // Enrich the DTO with trip statistics if available
                    tripStats[vehicle.id]?.let { stats ->
                        vehicleDTO.distance = (stats.distance) / 1000
                        vehicleDTO.firstTripStart = stats.firstTripStart
                    }
                    vehicleDTO
                }
        // Now we build the hierarchy of vehicles based on their teams
        stopWatch?.stopAndStart("Build team hierarchy")
        val vehiclesWithHierarchy = allVehicleDataDTO.map { vehicleDataDTO ->
            val team = vehicleDataDTO.team
            val teamHierarchy = buildTeamHierarchy(team) // Get full team hierarchy
            vehicleDataDTO.copy(teamHierarchy = teamHierarchy)
        }
        val teamHierarchy = buildTeamHierarchyForest(vehiclesWithHierarchy) { it.teamHierarchy }

        stopWatch?.stop()
        return teamHierarchy
    }


    // TODO seperate the data treatment method
    fun getNonGeolocVehiclesTableData(vehicles: List<VehicleEntity>? = null, stopWatch: StopWatch? = null): List<TeamHierarchyNode> {
        stopWatch?.start("filter non localized vehicles")
        val allVehicles = vehicles ?: VehicleEntity.listAll()
        stopWatch?.stopAndStart("compute daily stats")
        val tripStats = tripService.getTripDailyStats()


        // Map VehicleEntities to VehicleDTOs and enrich with trip statistics
        stopWatch?.stopAndStart("MapTo vehicle data DTO")
        val allVehicleDataDTO =
            allVehicles.filter { it.vehicleDevices.isNotEmpty() && it.vehicleTeams.isNotEmpty()}
                .map { vehicle ->
                    // Convert to VehicleTableDTO
                    val vehicleDTO = vehicleMapper.toVehicleTableDTO(vehicle)

                    // Enrich the DTO with trip statistics if available
                    tripStats[vehicle.id]?.let { stats ->
                        vehicleDTO.distance = (stats.distance) / 1000
                        vehicleDTO.firstTripStart = stats.firstTripStart
                    }
                    vehicleDTO
                }

        // Find last position info (poi or address)
        stopWatch?.stopAndStart("Get last position infos")
        allVehicleDataDTO.forEach { vehicleDataDTO ->
            vehicleDataDTO.lastPositionAddress = null
        }
        // Now we build the hierarchy of vehicles based on their teams
        stopWatch?.stopAndStart("Build team hierarchy")
        val vehiclesWithHierarchy = allVehicleDataDTO.map { vehicleDataDTO ->
            val team = vehicleDataDTO.team
            val teamHierarchy = buildTeamHierarchy(team) // Get full team hierarchy
            vehicleDataDTO.copy(teamHierarchy = teamHierarchy)
        }

        val teamHierarchy = buildTeamHierarchyForest(vehiclesWithHierarchy) { it.teamHierarchy }

        stopWatch?.stop()
        return teamHierarchy
    }

    // Helper function to build team hierarchy
    private fun buildTeamHierarchy(team: TeamDTO?): String {
        // Recursively build the team hierarchy
        val hierarchy = mutableListOf<String>()
        var currentTeam = team
        while (currentTeam != null) {
            hierarchy.add(currentTeam.label)
            currentTeam = currentTeam.parentTeam
        }
        // If the hierarchy is only one level, add "Interne" as the second level
        if (hierarchy.size == 1) {
            val teamLabel = hierarchy.first()
            hierarchy.add("$teamLabel Interne")
            return hierarchy.joinToString(" > ")
        } else
            return hierarchy.reversed().joinToString(" > ")
    }

    //function returns tracked and untracked vehicles(details) with replacing the last position by null for untracked vehicles/drivers
    fun getVehiclesDetails(): List<VehicleDTO> {

        //Get the IDs of untracked vehicles/drivers
        val untrackedVehicleIds = VehicleUntrackedPeriodEntity.findVehicleIdsWithUntrackedPeriod()
        val untrackedDriverIds = DriverUntrackedPeriodEntity.findDriverIdsWithUntrackedPeriod()

        //Fetch and map all Vehicles entities to VehicleDTOs
        val allVehicles = VehicleEntity.listAll()
        val allVehicleDTOs = allVehicles.map { vehicle ->
            vehicleMapper.toVehicleDTO(vehicle)
        }

        //Filter and modify the last position for untracked vehicles/drivers
        allVehicleDTOs.forEach { vehicleDTO ->
            // Find the most recent driver with end_date = null for this vehicle
            val recentDriver = vehicleDTO.drivers
                ?.filter { it.key.end == null }
                ?.maxByOrNull { it.key.start }

            val recentDriverId = recentDriver?.value?.id
            val isVehicleTracked = vehicleDTO.id !in untrackedVehicleIds
            val isDriverTracked = recentDriverId == null || recentDriverId !in untrackedDriverIds

            //If the vehicle or driver is untracked, find the most recent device and nullify its location
            if (!isVehicleTracked || !isDriverTracked) {
                vehicleDTO.devices
                    ?.filter { it.key.end == null }
                    ?.maxByOrNull { it.key.start }
                    ?.let { recentDevice ->
                        recentDevice.value.deviceDataState?.coordinate = null
                    }
            }
        }
        return allVehicleDTOs
    }


    @Transactional
    fun getVehiclesList(agencyIds: List<String>?): List<VehicleSummaryDTO> {

        val params = mutableMapOf<String, Any>()
        // Start the query
        var baseQuery = """
        SELECT v
        FROM VehicleEntity v
        LEFT JOIN FETCH VehicleDriverEntity vd ON v.id = vd.id.vehicleId
        LEFT JOIN FETCH DriverEntity d ON vd.id.driverId = d.id
        LEFT JOIN VehicleUntrackedPeriodEntity vup 
            ON vup.id.vehicleId = v.id 
            AND vup.id.startDate <= current_date()
            AND (vup.endDate IS NULL OR vup.endDate >= current_date())    
        LEFT JOIN DriverUntrackedPeriodEntity dup 
            ON dup.id.driverId = d.id 
            AND dup.id.startDate <= current_date() 
            AND (dup.endDate IS NULL OR dup.endDate >= current_date()) 
    """

        // Extend the query only if agencyIds are provided
        if (!agencyIds.isNullOrEmpty()) {

            baseQuery += """
                
            JOIN VehicleTeamEntity vt ON v.id = vt.id.vehicleId
            JOIN TeamEntity t ON vt.id.teamId = t.id
            LEFT JOIN t.parentTeam parent_team
                    WHERE vt.endDate IS NULL
                    AND (t.label IN :agencyIds
                    OR (parent_team IS NOT NULL AND parent_team.label IN :agencyIds)
                    )
            """
            params["agencyIds"] = agencyIds
        }

        baseQuery += """
            
            ${if (baseQuery.contains("WHERE")) "AND" else "WHERE"}  vup.id.startDate IS NULL
            AND dup.id.startDate IS NULL
        """.trimIndent()


        val panacheQuery = VehicleEntity.find(baseQuery, params)

        return panacheQuery.list()
            .filter { DeviceVehicleInstallEntity.getActiveDevice(it.id!!, LocalDate.now()) != null && it.vehicleTeams.isNotEmpty() }
            .map { vehicleMapper.toVehicleDTOSummary(it) }
    }

    // ====================================================
    // Méthodes pour récupérer la fenêtre de pause d’un Conducteur
    // ====================================================

    /**
     * findActiveVehicleTeams : Retourne la liste des teams actives pour un véhicule, à la date [refDate].
     * => endDate IS NULL ou endDate >= refDate
     */
    @Transactional
    fun findActiveVehicleTeams(vehicle: VehicleEntity, refDate: Timestamp): List<TeamEntity> {
        return vehicle.vehicleTeams
            .filter { it.endDate == null || it.endDate!! >= refDate }
            .mapNotNull { it.team }
            .distinct()
    }

    fun findInheritedStart(team: TeamEntity?): LocalTime? {
        if (team == null) return null
        return team.lunchBreakStart ?: findInheritedStart(team.parentTeam)
    }

    fun findInheritedEnd(team: TeamEntity?): LocalTime? {
        if (team == null) return null
        return team.lunchBreakEnd ?: findInheritedEnd(team.parentTeam)
    }

    /**
     * Calcule la fenêtre de pause pour UN véhicule (pas forcément “globale”).
     */
    fun getVehiclePauseWindow(vehicle: VehicleEntity, refDate: Timestamp): Pair<LocalTime?, LocalTime?> {
        val activeTeams = findActiveVehicleTeams(vehicle, refDate)

        val timeRanges = activeTeams.mapNotNull { team ->
            val finalStart = findInheritedStart(team)
            val finalEnd   = findInheritedEnd(team)
            if (finalStart != null && finalEnd != null) Pair(finalStart, finalEnd) else null
        }

        val earliestStart = timeRanges.minByOrNull { it.first }?.first
        val latestEnd     = timeRanges.maxByOrNull { it.second }?.second

        return Pair(earliestStart, latestEnd)
    }

    fun getCount(): Long {
        return VehicleEntity.count()
    }

    /**
     * Retourne un objet StatsDTO contenant :
     * - Le nombre de véhicules non liés à un driver actif.
     * - Le nombre de véhicules non liés à un device actif.
     * - Le nombre de véhicules non liés à une équipe active.
     *
     * Pour chaque statistique, nous utilisons une requête JPQL avec une sous-requête NOT EXISTS.
     */
    fun getStats(): StatsDTO {
        // Récupération de l'EntityManager via Panache
        val em = VehicleEntity.getEntityManager()

        // Véhicules sans driver actif : aucun enregistrement dans VehicleDriverEntity avec endDate IS NULL
        val countNoDriver: Long = em
            .createQuery(
                "select count(v) from VehicleEntity v " +
                        "where not exists (" +
                        "   select 1 from VehicleDriverEntity vd " +
                        "   where vd.vehicle = v and vd.endDate is null" +
                        ")",
                Long::class.java
            ).singleResult

        // Véhicules sans device actif : aucun enregistrement dans DeviceVehicleInstallEntity avec endDate IS NULL
        val countNoDevice: Long = em
            .createQuery(
                "select count(v) from VehicleEntity v " +
                        "where not exists (" +
                        "   select 1 from DeviceVehicleInstallEntity dvi " +
                        "   where dvi.vehicle = v and dvi.endDate is null" +
                        ")",
                Long::class.java
            ).singleResult

        // Véhicules sans équipe active : aucun enregistrement dans VehicleTeamEntity avec endDate IS NULL
        val countNoTeam: Long = em
            .createQuery(
                "select count(v) from VehicleEntity v " +
                        "where not exists (" +
                        "   select 1 from VehicleTeamEntity vt " +
                        "   where vt.vehicle = v and vt.endDate is null" +
                        ")",
                Long::class.java
            ).singleResult

        // Construction de la liste de Stat
        val stats = listOf(
            Stat(
                label = "Véhicules non liés à un driver",
                value = countNoDriver.toDouble(),
                description = "Nombre de véhicules sans driver actif"
            ),
            Stat(
                label = "Véhicules non liés à un device",
                value = countNoDevice.toDouble(),
                description = "Nombre de véhicules sans device actif"
            ),
            Stat(
                label = "Véhicules non liés à une équipe",
                value = countNoTeam.toDouble(),
                description = "Nombre de véhicules sans équipe active"
            )
        )

        // Création et retour de l'objet StatsDTO avec la date du moment
        return StatsDTO(
            date = LocalDateTime.now(),
            stats = stats
        )
    }
}

//To convert time from HH:MM format to second
fun convertHHMMToSeconds(drivingTime: String?): Long {
    if (drivingTime.isNullOrBlank()) {
        return 0L
    }

    // Split HH:MM string and convert to seconds
    val timeParts = drivingTime.split(":")
    if (timeParts.size == 2) {
        val hours = timeParts[0].toIntOrNull() ?: 0
        val minutes = timeParts[1].toIntOrNull() ?: 0
        return (hours * 3600L) + (minutes * 60L)
    }
    return 0L
}

// Tree node data class
data class TeamHierarchyNode(
    val label: String,
    val children: MutableList<TeamHierarchyNode> = mutableListOf(),
    val vehicles: MutableList<Any> = mutableListOf()
)

// Helper function to build team hierarchy
private fun buildTeamHierarchy(team: TeamDTO?): String {

    // Recursively build the team hierarchy
    val hierarchy = mutableListOf<String>()
    var currentTeam = team
    while (currentTeam != null) {
        hierarchy.add(currentTeam.label)
        currentTeam = currentTeam.parentTeam
    }
    // If the hierarchy is only one level, add "Interne" as the second level
    if (hierarchy.size == 1) {
        val teamLabel = hierarchy.first()
        hierarchy.add("$teamLabel Interne")
        return hierarchy.joinToString(" > ")
    } else
        return hierarchy.reversed().joinToString(" > ")
}

// Function to build a hierarchy tree for multiple top-level teams
fun <T> buildTeamHierarchyForest(vehicles: List<T>, extractTeamHierarchy: (T) -> String?): List<TeamHierarchyNode> {
    // Map to store team nodes by their labels
    val teamNodes = mutableMapOf<String, TeamHierarchyNode>()

    vehicles.forEach { vehicle ->
        val teamHierarchy = extractTeamHierarchy(vehicle)?.split(" > ")

        // Process the hierarchy and construct nodes
        var currentNode: TeamHierarchyNode? = null
        if (teamHierarchy != null) {
            for (teamLabel in teamHierarchy) {
                val node = teamNodes.getOrPut(teamLabel) { TeamHierarchyNode(teamLabel) }

                // Link the current node to its parent if it exists
                if (currentNode != null && !currentNode.children.contains(node)) {
                    currentNode.children.add(node)
                }

                currentNode = node
            }
        }
        // Add the vehicle to the leaf node
        currentNode?.vehicles?.add(vehicle as Any)
    }

    // Collect the top-level nodes (those that are not children of any other node)
    val allNodes = teamNodes.values.toSet()
    val childNodes = teamNodes.values.flatMap { it.children }.toSet()
    val topLevelNodes = allNodes.subtract(childNodes)

    return topLevelNodes.toList()
}

private fun getDorisView(vehiclesType: String): String {
    return when (vehiclesType) {
        "tracked" -> "trips_tracked_view"
        "untracked" -> "trips_untracked_view"
        "allVehicles" -> "trips_vehicle_team_view"
        else -> "trips_tracked_view"
    }
}

fun Instant?.until(duration: Temporal): Duration {
    return this?.let { Duration.between(this, duration) } ?: Duration.ZERO
}
