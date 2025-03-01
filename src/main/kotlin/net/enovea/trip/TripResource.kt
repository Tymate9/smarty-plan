package net.enovea.trip

import io.quarkus.security.Authenticated
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import net.enovea.api.trip.TripRepository

@Path("/api/trips")
@Authenticated
class TripResource(
    private val tripRepository: TripRepository,
    private val tripService: TripService
) {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
    fun getTripById(@PathParam("id") tripId: String): TripDTO? {
        return tripRepository.findById(tripId)
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/vehicle/{vehicleId}/{date}")
    fun getTripsByVehicleIdAndDate(
        @PathParam("vehicleId") vehicleId: String,
        @PathParam("date") date: String // format %Y%m%d
    ): TripEventsDTO? {
        return tripService.computeTripEventsDTO(vehicleId, date)
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/vehicle-non-geoloc/{vehicleId}/{date}")
    fun getTripsByNonGeolocalizedVehicleIdAndDate(
        @PathParam("vehicleId") vehicleId: String,
        @PathParam("date") date: String // format %Y%m%d
    ): TripEventsDTO? {
        return tripService.computeTripEventsDTO(vehicleId, date, false)
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/vehicle/{vehicleId}")
    fun getTripsByVehicleId(@PathParam("vehicleId") vehicleId: String): List<TripDTO> {
        return tripRepository.findByVehicleId(vehicleId)
    }
}
