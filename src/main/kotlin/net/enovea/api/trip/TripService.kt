package net.enovea.api.trip

import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.SpatialService
import net.enovea.domain.driver.DriverEntity
import net.enovea.domain.team.TeamEntity
import net.enovea.domain.vehicle.DeviceVehicleInstallEntity
import net.enovea.domain.vehicle.VehicleEntity
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import org.locationtech.jts.io.WKTWriter
import java.time.*
import java.time.format.DateTimeFormatter.BASIC_ISO_DATE

class TripService(
    private val tripRepository: TripRepository,
    private val spatialService: SpatialService
) {
    private val geometryFactory = GeometryFactory()

    fun computeTripEventsDTO(vehicleId: String, date: String): TripEventsDTO? {
        val parsedDate = LocalDate.parse(date, BASIC_ISO_DATE)
        val effectiveLunchBreak = getEffectiveLunchBreak(vehicleId, parsedDate)
        val (lunchBreakStart, lunchBreakEnd) = effectiveLunchBreak ?: (null to null)

        println("Heure de début extraite depuis la base de donnée : $lunchBreakStart")
        println("Heure de fin extraite depuis la base de donnée : $lunchBreakEnd")

        // check if the driver at that date on this vehicle can be localized
        // if yes, get his informations, if no, cancel
        val vehicle = VehicleEntity.getAtDateIfTracked(vehicleId, parsedDate)
            ?: return null

        val trips = tripRepository.findByVehicleIdAndDate(
            vehicleId,
            parsedDate
        )

        if (trips.isEmpty()) {
            return null
        }

        // compute events for each trip and stop between each trip
        val tripEvents = trips
            .filter { it.trace !== null }
            .reversed()
            .windowed(2, partialWindows = true)
            .reversed()
            // ^ this allows to have each trip with its preceding trip (if any) in the same window
            .flatMapIndexed { index, trips ->
                val trip = trips.first()
                val precedingTrip = trips.getOrNull(1)
                listOf(
                    computeStop(trip, precedingTrip, index, lunchBreakStart, lunchBreakEnd),
                    computeTrip(trip, index, lunchBreakStart, lunchBreakEnd)
                )
            }.toMutableList()

        // compute last trip event (either stop, vehicle running or vehicle idle)
        val lastTrip = trips.last()
        var lastTripStatus = lastTrip.tripStatus
        var lastPosition: Point? = null
        var lastPositionTime = lastTrip.endTime
        var poiAtEnd: PointOfInterestEntity? = null
        var addressAtEnd: String? = null
        val lastDeviceState = if (parsedDate == LocalDate.now()) // don't get device state if date isn't today
            vehicle.vehicle.vehicleDevices.firstOrNull {
                !listOf("PARKED", "NO_COM", "UNPLUGGED", "UNKNOWN", null).contains(it.device!!.deviceDataState?.state)
            }?.device?.deviceDataState
        else null
        if (lastDeviceState == null) {
            // if no device state, compute end POI/address
            lastPosition = geometryFactory.createPoint(Coordinate(lastTrip.endLng, lastTrip.endLat))
            poiAtEnd = spatialService.getNearestEntityWithinArea(lastPosition, PointOfInterestEntity::class)
            if (poiAtEnd == null)
                addressAtEnd = spatialService.getAddressFromEntity(lastPosition)
        } else {
            // if device state, add trip expectation
            lastPosition = lastDeviceState.coordinate
            addressAtEnd = lastDeviceState.address ?: lastPosition?.let { spatialService.getAddressFromEntity(it) }
            if (lastDeviceState.lastPositionTime != null) {
                lastPositionTime =
                    Instant.ofEpochMilli(lastDeviceState.lastPositionTime!!.time).atZone(ZoneId.of("Europe/Paris"))
                        .toLocalDateTime()
            }
            lastTripStatus = when (lastDeviceState.state) {
                "DRIVING" -> TripStatus.DRIVING
                "IDLE" -> TripStatus.IDLE
                else -> throw NotImplementedError("Unknown device state ${lastDeviceState.state}")
            }
            if (lunchBreakStart === null ||
                lunchBreakEnd === null ||
                !(lunchBreakStart >= lastPositionTime.toLocalTime() && lunchBreakEnd <= lastPositionTime.toLocalTime())
            ) {
                tripEvents.add(
                    TripEventDTO(
                        index = tripEvents.size,
                        eventType = TripEventType.TRIP_EXPECTATION,
                        trace = listOf(
                            geometryFactory.createLineString(
                                arrayOf(
                                    Coordinate(lastTrip.endLng, lastTrip.endLat),
                                    lastPosition?.coordinate
                                )
                            ).toText()
                        )
                    )
                )
            }
        }
        var tripEventDetails: List<TripEventDetails>? = null
        val eventTime = lastPositionTime.toLocalTime()
        if (lunchBreakStart != null && lunchBreakEnd != null) {
            if (!eventTime.isBefore(lunchBreakStart) && !eventTime.isAfter(lunchBreakEnd)) {
                addressAtEnd = "Pause midi de $lunchBreakStart à $lunchBreakEnd"
                poiAtEnd = null
                lastPosition = null
                tripEventDetails = listOf(
                    TripEventDetails(
                        type= TripEventDetailsType.LUNCH_BREAKING
                    )
                )
            }
        }
        val finalLat: Double? =
            if (lunchBreakStart != null && lunchBreakEnd != null && eventTime >= lunchBreakStart && eventTime <= lunchBreakEnd) {
                // Pendant la pause, on annule la position
                null
            } else {
                // En dehors de la pause, on utilise la dernière position si présente, sinon la valeur de repli
                lastPosition?.y ?: lastTrip.endLat
            }
        val finalLng: Double? =
            if (lunchBreakStart != null && lunchBreakEnd != null && eventTime >= lunchBreakStart && eventTime <= lunchBreakEnd) {
                null
            } else {
                lastPosition?.x ?: lastTrip.endLng
            }
        tripEvents.add(
            TripEventDTO(
                index = tripEvents.size,
                eventType = when (lastTripStatus) {
                    TripStatus.COMPLETED -> TripEventType.STOP
                    TripStatus.DRIVING -> TripEventType.VEHICLE_RUNNING
                    TripStatus.IDLE -> TripEventType.VEHICLE_IDLE
                },
                color = poiAtEnd?.category?.color ?: "black",
                poiId = poiAtEnd?.id,
                poiLabel = poiAtEnd?.getDenomination(),
                address = addressAtEnd ?: poiAtEnd?.address,
                lat = finalLat,
                lng = finalLng,
                start = lastPositionTime,
                tripEventDetails = tripEventDetails,
            )
        )

        val result = TripEventsDTO(
            vehicleId = vehicleId,
            licensePlate = vehicle.vehicle.licenseplate,
            driverName = vehicle.driver?.let { "${it.firstName} ${it.lastName}" } ?: "Véhicule non attribué",
            vehicleCategory = vehicle.vehicle.category?.label ?: "VL",
            range = lastTrip.endTime.toEpochSecond(ZoneOffset.of("Z")).toInt()
                    - trips.first().startTime.toEpochSecond(ZoneOffset.of("Z")).toInt(),
            tripAmount = trips.size,
            stopDuration = tripEvents.filter { it.eventType == TripEventType.STOP }.sumOf { it.duration ?: 0 },
            drivingDuration = trips.sumOf { it.duration ?: 0 },
            drivingDistance = trips.sumOf { it.distance ?: 0.0 } / 1000,
            idleDuration = trips.sumOf { it.idleDuration },
            poiAmount = tripEvents.count { it.poiId != null } + (poiAtEnd?.let { 1 } ?: 0),
            tripEvents = tripEvents,
            compactedTripEvents = fuseRedundantStops(fuseShortStops(tripEvents))
        )
        return result
    }

    private fun computeTrip(
        originalTrip: TripDTO,
        index: Int,
        lunchBreakStart: LocalTime?,
        lunchBreakEnd: LocalTime?
    ): TripEventDTO {
        val tripStartLocal = originalTrip.startTime.toLocalTime()
        val tripEndLocal = originalTrip.endTime.toLocalTime()

        // Si une plage de pause est définie, traiter les cas spécifiques
        if (lunchBreakStart != null && lunchBreakEnd != null) {
            // Cas : le trip est entièrement contenu dans la pause déjeuner
            if (tripStartLocal > lunchBreakStart && tripEndLocal < lunchBreakEnd) {
                return TripEventDTO(
                    index = index * 2 + 1,
                    eventType = TripEventType.TRIP,
                    address = "Pause déjeuner",
                    distance = originalTrip.distance?.div(1000),
                    duration = originalTrip.duration,
                    start = originalTrip.startTime,
                    end = originalTrip.endTime,
                    trace = null, // On renvoie null car le trip est entièrement dans la pause
                    tripEventDetails = listOf(
                        TripEventDetails(
                            type = TripEventDetailsType.LUNCH_BREAKING
                        )
                    )
                )
            }
            // Sinon, si le trip intersecte la pause (début ou fin inclus)
            if ((tripStartLocal <= lunchBreakStart && tripEndLocal >= lunchBreakStart) ||
                (tripStartLocal <= lunchBreakEnd && tripEndLocal >= lunchBreakEnd)
            ) {
                return processEventForLunchBreak(originalTrip, index, lunchBreakStart, lunchBreakEnd)
            }
        }
        // Cas standard : aucune modification
        return TripEventDTO(
            index = index * 2 + 1,
            eventType = TripEventType.TRIP,
            distance = originalTrip.distance?.div(1000),
            duration = originalTrip.duration,
            start = originalTrip.startTime,
            end = originalTrip.endTime,
            trace = listOf(originalTrip.trace),
            tripEventDetails = emptyList()
        )
    }

    private fun processEventForLunchBreak(
        originalTrip: TripDTO,
        index: Int,
        lunchBreakStart: LocalTime?,
        lunchBreakEnd: LocalTime?
    ): TripEventDTO {
        // Si l'un des horaires de pause est null, on retourne l'événement standard
        if (lunchBreakStart == null || lunchBreakEnd == null) {
            return TripEventDTO(
                index = index * 2 + 1,
                eventType = TripEventType.TRIP,
                distance = originalTrip.distance?.div(1000),
                duration = originalTrip.duration,
                start = originalTrip.startTime,
                end = originalTrip.endTime,
                trace = listOf(originalTrip.trace)
            )
        }

        // Appel à la méthode qui calcule la trace modifiée et les sous-événements pour la pause déjeuner.
        // Cette méthode retourne un couple (Pair) où :
        // - Le premier élément est une List<SubTripEvent>
        // - Le second élément est une List<String> contenant tous les segments recalculés
        val (subTripEventsList, traceList) = calcTraceAndSubEventsForLunchBreak(
            originalTrip,
            lunchBreakStart,
            lunchBreakEnd
        )
        // Ici, nous renvoyons l'intégralité de la liste des segments recalculés dans le champ trace,
        // ce qui permettra de disposer de deux segments distincts si le trip couvre la période de pause.
        return TripEventDTO(
            index = index * 2 + 1,
            eventType = TripEventType.TRIP,
            address = "Pause déjeuner",
            distance = originalTrip.distance?.div(1000),
            duration = originalTrip.duration,
            start = originalTrip.startTime,
            end = originalTrip.endTime,
            trace = traceList,             // Renvoie la liste complète des segments recalculés (ex. [segmentBefore, segmentAfter])
            tripEventDetails = subTripEventsList
        )
    }

    private fun calcTraceAndSubEventsForLunchBreak(
        originalTrip: TripDTO,
        lunchBreakStart: LocalTime,
        lunchBreakEnd: LocalTime
    ): Pair<List<TripEventDetails>, List<String?>> {
        // Récupération du device actif (activeDeviceId pourra rester null si aucun device actif n'est trouvé)
        val activeDevice =
            DeviceVehicleInstallEntity.getActiveDevice(originalTrip.vehicleId, originalTrip.startTime.toLocalDate())
        val activeDeviceId = activeDevice?.id?.toString()

        // Récupérer la liste complète des datapoints pour ce trajet
        val datapoints: List<DatapointDTO> = if (activeDeviceId != null) {
            tripRepository.findDatapointsForTrip(activeDeviceId, originalTrip.tripId)
        } else {
            emptyList()
        }

        val pStart = originalTrip.startTime.toLocalTime()
        val pEnd = originalTrip.endTime.toLocalTime()

        // Vérifier les cas en fonction de la période p et des horaires de pause
        return when {
            // Cas 1 : p inclut lunchBreakStart et lunchBreakEnd
            pStart <= lunchBreakStart && pEnd >= lunchBreakEnd -> {
                // Segment avant la pause : tous les datapoints dont l'heure est <= lunchBreakStart
                val segmentBeforeDatapoints = datapoints.filter { dp ->
                    dp.timestamp.toLocalTime() <= lunchBreakStart
                }.sortedBy { it.timestamp }
                // Segment après la pause : tous les datapoints dont l'heure est >= lunchBreakEnd
                val segmentAfterDatapoints = datapoints.filter { dp ->
                    dp.timestamp.toLocalTime() >= lunchBreakEnd
                }.sortedBy { it.timestamp }

                // Construction des traces à partir des coordonnées
                val geometryFactory = GeometryFactory()
                val writer = WKTWriter()
                val coordsBefore = segmentBeforeDatapoints.mapNotNull { dp ->
                    if (dp.locationLat != null && dp.locationLng != null)
                        Coordinate(dp.locationLng, dp.locationLat)
                    else null
                }.toTypedArray()
                val coordsAfter = segmentAfterDatapoints.mapNotNull { dp ->
                    if (dp.locationLat != null && dp.locationLng != null)
                        Coordinate(dp.locationLng, dp.locationLat)
                    else null
                }.toTypedArray()

                val traceBefore = if (coordsBefore.isNotEmpty())
                    writer.write(geometryFactory.createLineString(coordsBefore))
                else ""
                val traceAfter = if (coordsAfter.isNotEmpty())
                    writer.write(geometryFactory.createLineString(coordsAfter))
                else ""

                // Création des SubTripEvent
                val tripEventDetails = mutableListOf<TripEventDetails>()
                if (coordsBefore.isNotEmpty()) {
                    val lastCoordBefore = coordsBefore.last()
                    tripEventDetails.add(
                        TripEventDetails(
                            lat = lastCoordBefore.y,
                            lng = lastCoordBefore.x,
                            timestamp = lunchBreakStart,
                            type = TripEventDetailsType.START_LUNCH_BREAK,
                            description = "Pause déjeuner commencée durant ce trajet à $lunchBreakStart"
                        )
                    )
                }
                if (coordsAfter.isNotEmpty()) {
                    val firstCoordAfter = coordsAfter.first()
                    tripEventDetails.add(
                        TripEventDetails(
                            lat = firstCoordAfter.y,
                            lng = firstCoordAfter.x,
                            timestamp = lunchBreakEnd,
                            type = TripEventDetailsType.END_LUNCH_BREAK,
                            description = "Pause déjeuner terminée durant ce trajet à $lunchBreakEnd"
                        )
                    )
                }
                Pair(tripEventDetails, listOf(traceBefore, traceAfter))
            }
            // Cas 2 : p inclut lunchBreakStart seulement (début avant ou à lunchBreakStart, fin avant lunchBreakEnd)
            pStart <= lunchBreakStart && pEnd < lunchBreakEnd -> {
                // Filtrer les datapoints pour ne conserver que ceux dont l'heure locale est <= lunchBreakStart
                val segmentDatapoints = datapoints.filter { dp ->
                    dp.timestamp.toLocalTime() <= lunchBreakStart
                }.sortedBy { it.timestamp }

                val geometryFactory = GeometryFactory()
                val writer = WKTWriter()
                // Construire le tableau de coordonnées à partir des datapoints filtrés
                val coords = segmentDatapoints.mapNotNull { dp ->
                    if (dp.locationLat != null && dp.locationLng != null)
                        Coordinate(dp.locationLng, dp.locationLat)
                    else null
                }.toTypedArray()

                // Générer la trace (WKT) à partir des coordonnées filtrées
                val newTrace = if (coords.isNotEmpty())
                    writer.write(geometryFactory.createLineString(coords))
                else ""

                // Créer la liste des sous-événements avec un seul élément : START_LUNCH_BREAK
                val tripEventDetails = mutableListOf<TripEventDetails>()
                if (coords.isNotEmpty()) {
                    val lastCoord = coords.last()
                    tripEventDetails.add(
                        TripEventDetails(
                            lat = lastCoord.y,
                            lng = lastCoord.x,
                            timestamp = lunchBreakStart,
                            type = TripEventDetailsType.START_LUNCH_BREAK,
                            description = "Pause déjeuner commencée durant ce trajet à $lunchBreakStart"
                        )
                    )
                }

                Pair(tripEventDetails, listOf(newTrace))
            }
            // Cas 3 : p inclut lunchBreakEnd seulement (début après lunchBreakStart et fin après ou à lunchBreakEnd)
            pStart > lunchBreakStart && pEnd >= lunchBreakEnd -> {
                // Filtrer les datapoints pour ne conserver que ceux dont l'heure locale est < lunchBreakEnd
                val segmentDatapoints = datapoints.filter { dp ->
                    dp.timestamp.toLocalTime() >= lunchBreakEnd
                }.sortedBy { it.timestamp }

                val geometryFactory = GeometryFactory()
                val writer = WKTWriter()
                // Construire le tableau de coordonnées à partir des datapoints filtrés
                val coords = segmentDatapoints.mapNotNull { dp ->
                    if (dp.locationLat != null && dp.locationLng != null)
                        Coordinate(dp.locationLng, dp.locationLat)
                    else null
                }.toTypedArray()

                // Générer la trace (WKT) à partir des coordonnées filtrées
                val newTrace = if (coords.isNotEmpty())
                    writer.write(geometryFactory.createLineString(coords))
                else ""

                // Créer la liste des sous-événements avec un seul élément : END_LUNCH_BREAK
                val tripEventDetails = mutableListOf<TripEventDetails>()
                if (coords.isNotEmpty()) {
                    val firstCoord = coords.first()  // on prend le premier point de la trace recalculée
                    tripEventDetails.add(
                        TripEventDetails(
                            lat = firstCoord.y,
                            lng = firstCoord.x,
                            timestamp = lunchBreakEnd,
                            type = TripEventDetailsType.END_LUNCH_BREAK,  // Assurez-vous que cet enum est défini dans votre projet
                            description = "Pause déjeuner terminée durant ce trajet à $lunchBreakEnd"
                        )
                    )
                }

                Pair(tripEventDetails, listOf(newTrace))
            }
            // Cas 4 : p n'inclut ni lunchBreakStart ni lunchBreakEnd
            else -> {
                Pair(emptyList<TripEventDetails>(), listOf(originalTrip.trace))
            }
        }
    }

    private fun computeStop(
        originalTrip: TripDTO,
        precedingTrip: TripDTO?,
        index: Int,
        startLunchBreak: LocalTime?,
        endLunchBreak: LocalTime?
    ): TripEventDTO {
        val startPoint = geometryFactory.createPoint(Coordinate(originalTrip.startLng, originalTrip.startLat))
        val poiAtStart = spatialService.getNearestEntityWithinArea(startPoint, PointOfInterestEntity::class)
        val addressAtStart = if (poiAtStart == null) {
            spatialService.getAddressFromEntity(startPoint)
        } else null

        // Valeurs par défaut issues de poiAtStart
        var eventAddress = addressAtStart ?: poiAtStart?.address
        var eventPoiLabel = poiAtStart?.getDenomination()
        var eventPoiId = poiAtStart?.id
        var eventColor: String? = poiAtStart?.category?.color ?: "black"
        var eventLat: Double? = poiAtStart?.coordinate?.y ?: originalTrip.startLat
        var eventLng: Double? = poiAtStart?.coordinate?.x ?: originalTrip.startLng

        // Initialisation de la liste des sous-événements (SubTripEvent)
        val subEvents = mutableListOf<TripEventDetails>()

        if (precedingTrip != null && startLunchBreak != null && endLunchBreak != null) {
            val stopStartLocal = precedingTrip.endTime.toLocalTime()
            val stopEndLocal = originalTrip.startTime.toLocalTime()

            // Vérifier si lunchBreakStart est dans l'intervalle [stopStartLocal, stopEndLocal]
            if (startLunchBreak in stopStartLocal..<stopEndLocal.plusMinutes(1)) {
                subEvents.add(
                    TripEventDetails(
                        lat = eventLat,
                        lng = eventLng,
                        timestamp = startLunchBreak,
                        type = TripEventDetailsType.START_LUNCH_BREAK,
                        description = "Pause déjeuner commencée durant cet arrêt à $startLunchBreak"
                    )
                )
            }
            // Vérifier si lunchBreakEnd est dans l'intervalle [stopStartLocal, stopEndLocal]
            if (endLunchBreak in stopStartLocal..<stopEndLocal.plusMinutes(1)) {
                subEvents.add(
                    TripEventDetails(
                        lat = eventLat,
                        lng = eventLng,
                        timestamp = endLunchBreak,
                        type = TripEventDetailsType.END_LUNCH_BREAK,
                        description = "Pause déjeuner terminée durant cet arrêt à $endLunchBreak"
                    )
                )
            }
            // Si la période de STOP est entièrement incluse dans la pause déjeuner, anonymiser l'événement
            if (stopStartLocal >= startLunchBreak && stopEndLocal < endLunchBreak.plusMinutes(1)) {
                eventAddress = "Pause déjeuner"
                eventPoiLabel = null
                eventPoiId = null
                eventColor = "black"
                eventLat = null
                eventLng = null
                subEvents.add(
                    TripEventDetails(
                            type = TripEventDetailsType.LUNCH_BREAKING
                    )
                )
            }
        }

        return TripEventDTO(
            index = index * 2,
            eventType = TripEventType.STOP,
            lat = eventLat,
            lng = eventLng,
            color = eventColor,
            poiId = eventPoiId,
            poiLabel = eventPoiLabel,
            address = eventAddress,
            duration = precedingTrip?.let {
                originalTrip.startTime.toEpochSecond(ZoneOffset.of("Z")) - it.endTime.toEpochSecond(ZoneOffset.of("Z"))
            },
            start = precedingTrip?.endTime,
            end = originalTrip.startTime,
            tripEventDetails = subEvents
        )
    }

    private fun fuseShortStops(tripEvents: List<TripEventDTO>): List<TripEventDTO> {
        val result = mutableListOf<TripEventDTO>()
        var i = 0

        while (i < tripEvents.size) {
            val current = tripEvents[i]

            if (current.eventType == TripEventType.TRIP) {
                // Vérifier s'il y a un STOP suivant avec durée < 5 minutes (300 secondes) ET durée non nulle
                if (i + 1 < tripEvents.size && tripEvents[i + 1].eventType == TripEventType.STOP
                    && tripEvents[i + 1].duration?.let { it < 300 } == true
                ) {
                    // Rechercher le premier STOP suivant avec durée >= 5 minutes ou durée null
                    var j = i + 2
                    while (j < tripEvents.size) {
                        val nextStop = tripEvents[j]
                        if (nextStop.eventType != TripEventType.TRIP) {
                            // On break dans tout les cas si l'événement n'est pas un STOP (TRIP_EXPECTATION, VEHICLE_RUNNING, etc...)
                            // Un STOP avec durée >= 300 ou durée null est considéré comme un STOP long
                            if (nextStop.eventType != TripEventType.STOP || nextStop.duration?.let { it >= 300L } != false) {
                                break
                            }
                        }
                        j++
                    }

                    // Si un STOP avec durée >= 5 minutes ou durée null est trouvé
                    if (j < tripEvents.size) {
                        val eventsToMerge = tripEvents.subList(i, j)
                        val mergedTrip = mergeTrips(eventsToMerge)
                        result.add(mergedTrip)
                        i = j // Ne pas inclure le STOP long dans la fusion
                        continue
                    } else {
                        val eventsToMerge = tripEvents.subList(i, tripEvents.size)
                        val mergedTrip = mergeTrips(eventsToMerge)
                        result.add(mergedTrip)
                        break // Fusion terminée, sortir de la boucle
                    }
                }
            }
            result.add(current)
            i++
        }
        return result
    }

    private fun mergeTrips(events: List<TripEventDTO>): TripEventDTO {
        // Identification du premier et du dernier événement TRIP dans la liste
        val firstTrip = events.first { it.eventType == TripEventType.TRIP }
        val lastTrip = events.last { it.eventType == TripEventType.TRIP }

        // Calcul de la somme des distances (remplacer null par 0)
        val mergedDistance = events.sumOf { it.distance ?: 0.0 }

        // Calcul de la somme des durées (remplacer null par 0)
        val mergedDuration = events.sumOf { it.duration ?: 0L }

        // Collecte des indices des événements fusionnés
        val mergedSourceIndexes = events.map { it.index }

        // Fusionner les subTripEvents de tous les événements TRIP
        val mergedSubEvents = events.flatMap { it.tripEventDetails ?: emptyList() }.distinct()

        return TripEventDTO(
            index = firstTrip.index, // Index du premier trip
            eventType = TripEventType.TRIP, // Toujours TRIP
            distance = if (mergedDistance > 0) mergedDistance else null, // Somme des distances
            color = firstTrip.color, // Couleur du premier trip
            poiId = firstTrip.poiId, // poiId du premier trip
            poiLabel = firstTrip.poiLabel, // poiLabel du premier trip
            address = firstTrip.address, // Adresse du premier trip
            start = firstTrip.start, // Start du premier trip
            end = lastTrip.end, // End du dernier trip
            duration = mergedDuration, // Somme des durées
            lat = firstTrip.lat, // Lat du premier trip
            lng = firstTrip.lng, // Lng du premier trip
            trace = null, // Toujours null
            tripEventDetails = mergedSubEvents,
            sourceIndexes = mergedSourceIndexes // Liste des indices fusionnés
        )
    }

    private fun fuseRedundantStops(tripEvents: List<TripEventDTO>): List<TripEventDTO> {
        val result = mutableListOf<TripEventDTO>()
        var i = 0

        while (i < tripEvents.size) {
            val current = tripEvents[i]

            // Vérifier si l'événement actuel est un STOP avec un poiId non nul
            if (current.eventType == TripEventType.STOP && current.poiId != null) {
                var mergeStartIndex = i
                val poiIdToMerge = current.poiId
                val eventsToMerge = mutableListOf<TripEventDTO>()
                eventsToMerge.add(current)
                var j = i + 1

                // Parcourir les événements suivants pour détecter des séquences de STOP/TRIP/STOP avec le même poiId
                while (j + 1 < tripEvents.size) {
                    val nextEvent = tripEvents[j]
                    val followingStop = tripEvents[j + 1]

                    // Vérifier si le prochain événement est un TRIP suivi d'un STOP avec le même poiId
                    if (nextEvent.eventType == TripEventType.TRIP &&
                        followingStop.eventType == TripEventType.STOP &&
                        followingStop.poiId == poiIdToMerge
                    ) {
                        eventsToMerge.add(nextEvent)       // Ajouter le TRIP
                        eventsToMerge.add(followingStop)  // Ajouter le STOP
                        j += 2 // Avancer de deux positions
                    } else {
                        break
                    }
                }

                // Si au moins deux arrêts avec le même poiId sont trouvés, procéder à la fusion
                if (eventsToMerge.size >= 3) { // STOP + TRIP + STOP
                    val mergedStop = mergeStops(
                        eventsToMerge,
                        j + 1 == tripEvents.size && eventsToMerge.last().start?.toLocalDate() == LocalDate.now()
                    )
                    result.add(mergedStop)
                    i = j // Avancer l'index au prochain événement non fusionné
                    continue
                }
            }

            // Ajouter l'événement actuel au résultat s'il n'est pas fusionné
            result.add(current)
            i++
        }

        return result
    }

    private fun mergeStops(events: List<TripEventDTO>, isOngoing: Boolean = false): TripEventDTO {
        // Le premier événement doit être un STOP
        val firstStop = events.first { it.eventType == TripEventType.STOP }
        // Le dernier événement doit être un STOP
        val lastStop = events.last { it.eventType == TripEventType.STOP }

        // Calcul de la somme des distances (remplacer null par 0)
        val mergedDistance = events.sumOf { it.distance ?: 0.0 }

        // Calcul de la somme des durées (remplacer null par 0)
        val mergedDuration = events.sumOf { it.duration ?: 0L }

        // Collecte des indices des événements fusionnés
        val mergedSourceIndexes = events.map { it.index }

        // Fusionner les subTripEvents de tous les événements STOP
        val mergedSubEvents = events.flatMap { it.tripEventDetails ?: emptyList() }.distinct()

        return TripEventDTO(
            index = firstStop.index, // Index du premier STOP
            eventType = TripEventType.STOP, // Toujours STOP après fusion
            distance = if (mergedDistance > 0) mergedDistance else null, // Somme des distances
            color = firstStop.color, // Couleur du premier STOP
            poiId = firstStop.poiId, // poiId du premier STOP
            poiLabel = firstStop.poiLabel, // poiLabel du premier STOP
            address = firstStop.address, // Adresse du premier STOP
            start = firstStop.start, // Start du premier STOP
            end = lastStop.end, // End du dernier STOP
            duration = if (isOngoing) null else mergedDuration, // Somme des durées (l'évènement n'a pas de durée s'il est en cours)
            lat = firstStop.lat, // Lat du premier STOP
            lng = firstStop.lng, // Lng du premier STOP
            trace = null, // Toujours null
            tripEventDetails = mergedSubEvents,
            sourceIndexes = mergedSourceIndexes // Liste des indices fusionnés
        )
    }

    fun getTripDailyStats(): Map<String, TripDailyStats> {
        return tripRepository.aggregateDailyStats()
            .associate { it.vehicleId to TripDailyStats(it.distance, it.firstTripStart) }
    }

    //TODO(Ces fonctionnalités doivent être déplacés)

    private fun getEffectiveLunchBreak(vehicleId: String, date: LocalDate): Pair<LocalTime?, LocalTime?>? {
        // 1) Récupérer le véhicule + driver s’il est “tracked” à la date
        val vehicleTracked = VehicleEntity.getAtDateIfTracked(vehicleId, date)
            ?: return null  // si on ne trouve pas de suivi, on n’a pas d’horaires

        // 2) Driver => on tente de récupérer la Team du driver (active à cette date)
        val driver = vehicleTracked.driver
        if (driver != null) {
            // Méthode perso qui récupère la “team active” du driver pour cette date
            val driverTeams = findActiveDriverTeams(driver, date)
            // On prend la première team (ou toutes, selon la logique)
            val (start, end) = getInheritedLunchBreakFromTeams(driverTeams)
            if (start != null && end != null) {
                // On a trouvé une plage de pause
                return Pair(start, end)
            }
        }

        // 3) Sinon, on prend la Team du véhicule
        val veh = vehicleTracked.vehicle
        val vehicleTeams = findActiveVehicleTeams(veh, date)
        val (startVeh, endVeh) = getInheritedLunchBreakFromTeams(vehicleTeams)
        if (startVeh != null && endVeh != null) {
            return Pair(startVeh, endVeh)
        }

        // 4) Si aucune plage trouvée, on renvoie null
        return null
    }

    /**
     * Extrait la pause (start, end) en tenant compte de l’héritage
     * depuis une liste de teams (si l’une d’entre elles a une pause).
     * Selon ta logique, on peut prioriser la "plus spécifique" ou la "plus large".
     */
    private fun getInheritedLunchBreakFromTeams(teams: List<TeamEntity>): Pair<LocalTime?, LocalTime?> {
        // On peut chercher la première team qui a lunchBreakStart/end non null,
        // sinon remonter au parent. Si tu as plusieurs teams actives,
        // il faut décider laquelle on prend (ex. la plus “récente”).
        for (team in teams) {
            val (start, end) = findLunchBreakWithInheritance(team)
            if (start != null && end != null) {
                return Pair(start, end)
            }
        }
        return Pair(null, null)
    }

    /**
     * Remonte la hiérarchie (parentTeam) si lunchBreakStart ou lunchBreakEnd est null.
     */
    private fun findLunchBreakWithInheritance(team: TeamEntity?): Pair<LocalTime?, LocalTime?> {
        if (team == null) return Pair(null, null)
        val start = team.lunchBreakStart
        val end = team.lunchBreakEnd
        if (start != null && end != null) {
            return Pair(start, end)
        }
        // Sinon, on remonte au parent
        return findLunchBreakWithInheritance(team.parentTeam)
    }

    /**
     * Renvoie la liste des teams actives pour le driver à la date donnée.
     * Hypothèse : endDate IS NULL ou >= date (selon ta logique).
     */
    private fun findActiveDriverTeams(driver: DriverEntity, date: LocalDate): List<TeamEntity> {
        // On parcourt driver.driverTeams
        // Filtrer sur end_date IS NULL ou end_date >= date
        // et date de début <= date, etc.
        return driver.driverTeams
            .filter { it.endDate == null || it.endDate!!.toLocalDateTime().toLocalDate() >= date }
            .mapNotNull { it.team }
    }

    /**
     * Renvoie la liste des teams actives pour le véhicule à la date donnée.
     */
    private fun findActiveVehicleTeams(vehicle: VehicleEntity, date: LocalDate): List<TeamEntity> {
        return vehicle.vehicleTeams
            .filter { it.endDate == null || it.endDate!!.toLocalDateTime().toLocalDate() >= date }
            .mapNotNull { it.team }
    }
}