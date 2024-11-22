package net.enovea.api.trip

import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import net.enovea.api.poi.PointOfInterestEntity
import net.enovea.common.geo.SpatialService
import net.enovea.repository.TripRepository
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.GeometryFactory

@Path("/api/trips")
class TripResource(
    private val tripRepository: TripRepository,
    private val spatialService: SpatialService<PointOfInterestEntity>,
) {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
    fun getTripById(@PathParam("id") tripId: String): TripDTO? {
        val geometryFactory = GeometryFactory()
        return tripRepository.findById(tripId)?.let {
            trip ->
            val startPoint = geometryFactory.createPoint(Coordinate(trip.startLng, trip.startLat))
            val endPoint = geometryFactory.createPoint(Coordinate(trip.endLng, trip.endLat))
            trip.poiAtStart = spatialService.getNearestEntityWithinRadius(startPoint, 100.0)
            trip.poiAtEnd = spatialService.getNearestEntityWithinRadius(endPoint, 100.0)
            if (trip.poiAtStart == null) {
                trip.addressAtStart = spatialService.getAddressFromEntity(startPoint)
            }
            if (trip.poiAtEnd == null) {
                trip.addressAtEnd = spatialService.getAddressFromEntity(endPoint)
            }
            trip
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/vehicle/{vehicleId}")
    fun getTripsByVehicleId(@PathParam("vehicleId") vehicleId: String): List<TripDTO> {
        return tripRepository.findByVehicleId(vehicleId)
    }
}