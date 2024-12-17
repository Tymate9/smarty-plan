package net.enovea.api.poi

import io.quarkus.runtime.StartupEvent
import io.quarkus.scheduler.Scheduled
import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.event.Observes
import jakarta.transaction.Transactional
import net.enovea.common.geo.GeoCodingService
import org.jboss.logging.Logger

@ApplicationScoped
class AddressUpdaterScheduler(
    private val geoCodingService: GeoCodingService,
) {
    private val logger: Logger = Logger.getLogger(AddressUpdaterScheduler::class.java)


    // Exécute le scheduler le deuxième dimanche de chaque mois
    @Scheduled(cron = "0 0 0 ? * 7#2")
    fun scheduledUpdate() {
        logger.info("Running scheduled address update...")
        updateAddresses()
    }

/*    // Exécute le scheduler au démarrage de l'application
    fun onStart(@Observes event: StartupEvent) {
        logger.info("Application started. Running initial address update...")
        updateAddresses()
    }*/

    fun updateAddresses() {
        val pointsOfInterest = PointOfInterestEntity.listAll()
        pointsOfInterest.forEach { poi ->
            updateAdresse(poi)
        }
        logger.info("Updated ${pointsOfInterest.size} addresses.")
    }

    @Transactional
    fun updateAdresse(poiDetached: PointOfInterestEntity) {
        logger.warn("Traitement du POI : " + poiDetached.client_code)
        val poi = PointOfInterestEntity.findById(poiDetached.id)
        val newAddress = geoCodingService.reverseGeocode(poi!!.coordinate)
        poi.address = newAddress ?: "Adresse inconnu"
        PointOfInterestEntity.persist(poi)
    }
}