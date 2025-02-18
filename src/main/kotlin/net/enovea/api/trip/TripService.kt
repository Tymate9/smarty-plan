package net.enovea.api.trip

import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.SpatialService
import net.enovea.domain.vehicle.VehicleEntity
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.Point
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter.BASIC_ISO_DATE

class TripService(
    private val tripRepository: TripRepository,
    private val spatialService: SpatialService
) {

    fun computeTripEventsDTO(vehicleId: String, date: String): TripEventsDTO? {
        val parsedDate = LocalDate.parse(date, BASIC_ISO_DATE)

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
        val geometryFactory = GeometryFactory()

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
                val startPoint = geometryFactory.createPoint(Coordinate(trip.startLng, trip.startLat))
                val poiAtStart = spatialService.getNearestEntityWithinArea(startPoint, PointOfInterestEntity::class)
                val addressAtStart = if (poiAtStart == null) {
                    spatialService.getAddressFromEntity(startPoint)
                } else null
                listOf(
                    TripEventDTO(
                        index = index * 2,
                        eventType = TripEventType.STOP,
                        lat = poiAtStart?.coordinate?.y ?: trip.startLat,
                        lng = poiAtStart?.coordinate?.x ?: trip.startLng,
                        color = poiAtStart?.category?.color ?: "black",
                        poiId = poiAtStart?.id,
                        poiLabel = poiAtStart?.getDenomination(),
                        address = addressAtStart ?: poiAtStart?.address,
                        duration = precedingTrip?.let {
                            trip.startTime.toEpochSecond(ZoneOffset.of("Z")) - it.endTime.toEpochSecond(
                                ZoneOffset.of("Z")
                            )
                        },
                        start = precedingTrip?.endTime,
                        end = trip.startTime
                    ),
                    TripEventDTO(
                        index = index * 2 + 1,
                        eventType = TripEventType.TRIP,
                        distance = trip.distance?.div(1000),
                        duration = trip.duration,
                        start = trip.startTime,
                        end = trip.endTime,
                        trace = trip.trace,
                    )
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
                lastPositionTime = Instant.ofEpochMilli(lastDeviceState.lastPositionTime!!.time).atZone(ZoneId.of("Europe/Paris")).toLocalDateTime()
            }
            lastTripStatus = when (lastDeviceState.state) {
                "DRIVING" -> TripStatus.DRIVING
                "IDLE" -> TripStatus.IDLE
                else -> throw NotImplementedError("Unknown device state ${lastDeviceState.state}")
            }
            tripEvents.add(
                TripEventDTO(
                    index = tripEvents.size,
                    eventType = TripEventType.TRIP_EXPECTATION,
                    trace = geometryFactory.createLineString(
                        arrayOf(
                            Coordinate(lastTrip.endLng, lastTrip.endLat),
                            lastPosition?.coordinate
                        )
                    ).toText()
                )
            )
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
                lat = lastPosition?.y ?: lastTrip.endLat,
                lng = lastPosition?.x ?: lastTrip.endLng,
                start = lastPositionTime,
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
                        if (nextStop.eventType == TripEventType.STOP) {
                            // Un STOP avec durée >= 300 ou durée null est considéré comme un STOP long
                            if (nextStop.duration?.let { it >= 300L } != false) {
                                break
                            }
                        }
                        j++
                    }

                    // Si un STOP avec durée >= 5 minutes ou durée null est trouvé
                    if (j < tripEvents.size) {
                        println("Fusion des événements de l'index $i à ${j - 1}")
                        val eventsToMerge = tripEvents.subList(i, j)
                        val mergedTrip = mergeTrips(eventsToMerge)
                        result.add(mergedTrip)
                        i = j // Ne pas inclure le STOP long dans la fusion
                        continue
                    } else {
                        // Si aucun STOP long n'est trouvé jusqu'à la fin, fusionner jusqu'à la fin
                        println("Fusion des événements de l'index $i à la fin de la liste")
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

        println("Fusion des trajets: Durée totale=$mergedDuration, Distance totale=$mergedDistance, Indices fusionnés=$mergedSourceIndexes")

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
                    println("Fusion des événements de l'index $mergeStartIndex à ${j - 1}")
                    val mergedStop = mergeStops(eventsToMerge)
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

    private fun mergeStops(events: List<TripEventDTO>): TripEventDTO {
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

        println("Fusion des arrêts redondants: Durée totale=$mergedDuration, Distance totale=$mergedDistance, Indices fusionnés=$mergedSourceIndexes")

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
            duration = mergedDuration, // Somme des durées
            lat = firstStop.lat, // Lat du premier STOP
            lng = firstStop.lng, // Lng du premier STOP
            trace = null, // Toujours null
            sourceIndexes = mergedSourceIndexes // Liste des indices fusionnés
        )
    }

    fun getTripDailyStats(): Map<String, TripDailyStats> {
        return tripRepository.aggregateDailyStats()
            .associate { it.vehicleId to TripDailyStats(it.distance, it.firstTripStart) }
    }
}