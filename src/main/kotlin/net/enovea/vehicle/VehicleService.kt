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
import kotlin.math.min
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
    fun getVehiclesStatsOverPeriod(startDate: String, endDate: String , teamLabels: List<String>? ,vehicleIds :List<String>?, driversIds: List<String>? , vehiclesType: String): Pair<List<TeamHierarchyNode>, Map<String, String>>? {

        //choose the doris view depending on the vehiclesType (all, tracked or untracked)
        println(vehiclesType)
        val dorisView = getDorisView(vehiclesType)
        println(dorisView)

        val vehiclesStats = vehicleStatsRepository.findVehicleStatsOverSpecificPeriod(startDate, endDate ,teamLabels ,vehicleIds, driversIds ,dorisView )

        val totalVehiclesStatsMap = calculateTotalVehiclesStats(vehiclesStats)
        val latestTeams: Map<String, TeamDTO> = VehicleTeamEntity.getLatestTeams().mapValues { teamMapper.toDto(it.value) }

        val vehiclesWithHierarchy = vehiclesStats.map { stats ->

            // Fetch the team using the vehicleId
            val team = stats.vehicleId?.let { latestTeams[it] }

            // Build the team hierarchy
            val teamHierarchy = buildTeamHierarchy(team)

            // Create a new instance of VehicleStatsDTO with enriched information
            val vehicleStatsDTO = VehicleStatsDTO(
                tripDate = stats.tripDate,
                vehicleId = stats.vehicleId,
                tripCount = stats.tripCount,
                distanceSum = formatDistance(stats.distanceSum ?: 0),
                drivingTime = formatDuration(stats.drivingTime ?: 0),
                distancePerTripAvg = formatDistance(stats.distancePerTripAvg ?: 0),
                durationPerTripAvg = formatDuration(stats.durationPerTripAvg ?: 0),
                hasLateStartSum = stats.hasLateStartSum,
                hasLateStop = stats.hasLateStop,
                hasLastTripLong = stats.hasLastTripLong,
                rangeAvg = formatDuration(stats.rangeAvg ?: 0),
                waitingDuration = formatDuration(stats.waitingDuration ?: 0),
                licensePlate = stats.licensePlate,
                driverName = stats.driverName,
            )
            VehiclesStatsDTO(
                vehicleStats = vehicleStatsDTO,
                team = team,
                teamHierarchy = teamHierarchy
            )
        }
        val teamHierarchy = buildTeamHierarchyForest(vehiclesWithHierarchy) { it.teamHierarchy }
        return Pair(teamHierarchy, totalVehiclesStatsMap)
    }


    //function to calculate total statistics(indicators) displayed on the page('suivi d'activité')
    private fun calculateTotalVehiclesStats(vehiclesStats: List<VehicleStatsQueryResult>): Map<String, String> {

        val totalVehicles = vehiclesStats.size
        val totalDrivers = vehiclesStats.count { !it.driverName.isNullOrEmpty() }
        val totalDistance = vehiclesStats.sumOf { it.distanceSum ?: 0 }
        val totalDrivingTime = vehiclesStats.sumOf { it.drivingTime ?: 0 }
        val totalTripCount = vehiclesStats.sumOf { it.tripCount }
        val totalWaitingTime = vehiclesStats.sumOf { it.waitingDuration ?: 0 }

        val averageDistance = if (totalTripCount > 0) round(totalDistance.toDouble() / totalTripCount).toInt() else 0
        val averageDuration = if (totalTripCount > 0) round(totalDrivingTime.toDouble() / totalTripCount).toLong() else 0
        val averageRangeAvg = vehiclesStats.mapNotNull { it.rangeAvg }.average().toLong()

        val totalHasLateStart = vehiclesStats.sumOf { it.hasLateStartSum }
        val totalHasLateStop = vehiclesStats.sumOf { it.hasLateStop }
        val totalHasLastTripLong = vehiclesStats.sumOf { it.hasLastTripLong }

        // Return results as a map
        return mapOf(
            "totalVehicles" to totalVehicles.toString(),
            "totalDrivers" to totalDrivers.toString(),
            "totalDistanceSum" to formatDistance(totalDistance),
            "totalTripCount" to totalTripCount.toString(),
            "totalDrivingTime" to formatDuration(totalDrivingTime),
            "averageDistance" to formatDistance(averageDistance),
            "averageDuration" to formatDuration(averageDuration),
            "totalWaitingTime" to formatDuration(totalWaitingTime),
            "averageRangeAvg" to formatDuration(averageRangeAvg),
            "totalHasLateStartSum" to totalHasLateStart.toString(),
            "totalHasLateStop" to totalHasLateStop.toString(),
            "totalHasLastTripLong" to totalHasLastTripLong.toString()
        )
    }


    //function to get the daily statistics of a vehicle over a period
    fun getVehicleStatsDaily(startDate: String, endDate: String , vehicleId: String, vehiclesType: String): List<VehicleStatsDTO>{
        val dorisView = getDorisView(vehiclesType)
        return  vehicleStatsRepository.findVehicleDailyStats(startDate,endDate,vehicleId,dorisView).map {
            VehicleStatsDTO(
                tripDate = it.tripDate,
                vehicleId = it.vehicleId,
                tripCount = it.tripCount,
                distanceSum = formatDistance(it.distanceSum ?: 0),
                drivingTime = formatDuration(it.drivingTime ?: 0),
                distancePerTripAvg = formatDistance(it.distancePerTripAvg ?: 0),
                durationPerTripAvg = formatDuration(it.durationPerTripAvg ?: 0),
                hasLateStartSum = it.hasLateStartSum,
                hasLateStop = it.hasLateStop,
                hasLastTripLong = it.hasLastTripLong,
                rangeAvg = formatDuration(it.rangeAvg ?: 0),
                waitingDuration = formatDuration(it.waitingDuration ?: 0),
                licensePlate = it.licensePlate,
                driverName = it.driverName
            )
        }
    }

    //function returns vehicles statistics displayed on the page ('QSE  reports')
    fun getVehiclesStatsQSEReport(startDate: String, endDate: String , teamLabels: List<String>? ,vehicleIds :List<String>?, driversIds: List<String>?, vehiclesType: String): Pair<List<TeamHierarchyNode>, Map<String, String>>? {

        val dorisView = getDorisView(vehiclesType)
        val vehiclesStatsQse = vehicleStatsRepository.findVehicleStatsQSEOverSpecificPeriod(startDate, endDate ,teamLabels ,vehicleIds, driversIds , dorisView )

        val totalVehiclesStatsQSEMap = calculateTotalVehiclesStatsQSE(vehiclesStatsQse)
        val latestTeams: Map<String, TeamDTO> = VehicleTeamEntity.getLatestTeams().mapValues { teamMapper.toDto(it.value) }

        val vehiclesWithHierarchy = vehiclesStatsQse.map { stats ->

            // Fetch the team using the vehicleId
            val team = stats.vehicleId?.let { latestTeams[it] }

            // Build the team hierarchy
            val teamHierarchy = buildTeamHierarchy(team)

            // Create an instance of VehicleStatsQseDTO
            val vehicleStatsQseDTO = VehicleStatsQseDTO(
                tripDate = stats.tripDate,
                vehicleId = stats.vehicleId,
                distanceSum = formatDistance(stats.distanceSum ?: 0),
                highwayDistanceSum = formatDistance(stats.highwayDistanceSum ?: 0),
                roadDistanceSum = formatDistance(stats.roadDistanceSum ?: 0),
                cityDistanceSum = formatDistance(stats.cityDistanceSum ?: 0),
                durationPerTripAvg = formatDuration(stats.durationPerTripAvg ?: 0),
                licensePlate = stats.licensePlate,
                driverName = stats.driverName,
                tripCount = stats.tripCount,
                waitingDuration = formatDuration(stats.waitingDuration ?: 0),
                drivingTime = formatDuration(stats.drivingTime ?: 0),
                rangeAvg = formatDuration(stats.rangeAvg ?: 0),
                idleDuration = formatDuration(stats.idleDuration ?: 0),
                distanceMax = formatDistance(stats.distanceMax ?: 0),
                highwayAccelScore = formatScore(stats.highwayAccelScore),
                roadAccelScore = formatScore(stats.roadAccelScore),
                cityAccelScore = formatScore(stats.cityAccelScore),
                highwayTurnScore = formatScore(stats.highwayTurnScore),
                roadTurnScore = formatScore(stats.roadTurnScore),
                cityTurnScore = formatScore(stats.cityTurnScore),
                highwaySpeedScore = formatScore(stats.highwaySpeedScore, isPercent = true),
                roadSpeedScore = formatScore(stats.roadSpeedScore, isPercent = true),
                citySpeedScore = formatScore(stats.citySpeedScore, isPercent = true),
            )
            VehiclesStatsQseDTO(
                vehicleStatsQse = vehicleStatsQseDTO,
                team = team,
                teamHierarchy = teamHierarchy
            )
        }
        val teamHierarchy = buildTeamHierarchyForest(vehiclesWithHierarchy) { it.teamHierarchy }
        return Pair(teamHierarchy, totalVehiclesStatsQSEMap)
    }

    //function to calculate total statistics(indicators) displayed on the page('QSE Reports')
    private fun calculateTotalVehiclesStatsQSE(vehiclesStats: List<VehicleStatsQseQueryResult>): Map<String, String> {
        val totalDistance = vehiclesStats.sumOf { it.distanceSum ?: 0 }
        val totalDrivingTime = vehiclesStats.sumOf { it.drivingTime ?: 0 }
        val totalWaitingTime = vehiclesStats.sumOf { it.waitingDuration ?: 0 }
        val averageRangeAvg = vehiclesStats.mapNotNull { it.rangeAvg }.average().toLong()
        val idleDurationTotal = vehiclesStats.sumOf { it.idleDuration ?: 0 }
        val longestTrip = vehiclesStats.maxOf { it.distanceMax ?:0 }

        // get accel stddev averages weighted by distance and compute selection scores with them
        val avgScore = vehiclesStats.mapNotNull { v ->
            if (v.turnScore != null && v.accelScore != null)
                (v.turnScore!! + v.accelScore!!) / 2
            else null
        }.average()
        val avgTurnScore = vehiclesStats.mapNotNull { v -> v.turnScore }.average()
        val avgAccelScore = vehiclesStats.mapNotNull { v -> v.accelScore }.average()
        val weightedAvgScore = vehiclesStats.mapNotNull { v ->
            if (v.distanceSum != null && v.turnScore != null && v.accelScore != null)
                v.distanceSum!!.toDouble() * (v.turnScore!! + v.accelScore!!) / 2
            else null
        }.sum() / totalDistance
        val weightedAvgTurnScore = vehiclesStats.mapNotNull { v ->
            if (v.distanceSum != null && v.turnScore != null && v.accelScore != null)
                v.distanceSum!! * v.turnScore!!
            else null
        }.sum().toDouble() / totalDistance
        val weightedAvgAccelScore = vehiclesStats.mapNotNull { v ->
            if (v.distanceSum != null && v.turnScore != null && v.accelScore != null)
                v.distanceSum!! * v.accelScore!!
            else null
        }.sum().toDouble() / totalDistance

        return mapOf(
            "totalDistanceSum" to formatDistance(totalDistance),
            "totalDrivingTime" to formatDuration(totalDrivingTime),
            "totalWaitingTime" to formatDuration(totalWaitingTime),
            "longestTrip" to formatDistance(longestTrip),
            "averageRangeAvg" to formatDuration(averageRangeAvg),
            "idleDurationTotal" to formatDuration(idleDurationTotal),
            "useSeverity" to getLetterScoring(avgScore),
            "turnUseSeverity" to getLetterScoring(avgTurnScore),
            "accelerationUseSeverity" to getLetterScoring(avgAccelScore),
            "riskExposure" to getLetterScoring(weightedAvgScore),
            "turnRiskExposure" to getLetterScoring(weightedAvgTurnScore),
            "accelerationRiskExposure" to getLetterScoring(weightedAvgAccelScore)
        )
    }

    private fun formatDistance(distance: Int): String {
        return distance
            .toString()
            .reversed()
            .chunked(3)
            .joinToString(" ")
            .reversed() + " km"
    }

    private fun formatDuration(seconds: Long): String {
        val days = seconds / 86400
        val hours = (seconds % 86400) / 3600
        val minutes = (seconds % 3600) / 60
        return when {
            days > 0 -> String.format("%dj %dh %dm", days, hours, minutes)
            hours > 0 -> String.format("%dh %dm", hours, minutes)
            minutes > 0 -> String.format("%dm", minutes)
            else -> String.format("%ds", seconds)
        }
    }

    private fun formatScore(score: Int?, isPercent: Boolean = false): String {
        return if (score != null) {
            if (isPercent) {
                "${min(score, 100)}%" // we cap percentage scores at 100
            } else {
                "$score/20"
            }
        } else {
            "N/A"
        }
    }

    private fun getLetterScoring(score: Double): String {
        return when {
            score > 16 && score < 20 -> "A"
            score > 14 -> "B"
            score > 12 -> "C"
            score > 10 -> "D"
            score > 0 -> "E"
            else -> "N/A"
        }
    }

    //To convert time from HH:MM format to second
    private fun convertHHMMToSeconds(drivingTime: String?): Long {
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
        "tracked" -> "trips_tracked_view_with_angles"
        "untracked" -> "trips_untracked_view_with_angles"
        "allVehicles" -> "trips_vehicle_team_view_with_angles"
        else -> "trips_tracked_view_with_angles"
    }
}

fun Instant?.until(duration: Temporal): Duration {
    return this?.let { Duration.between(this, duration) } ?: Duration.ZERO
}
