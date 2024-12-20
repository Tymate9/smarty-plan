package net.enovea.repository

import net.enovea.DorisJdbiContext
import net.enovea.api.trip.TripDTO
import net.enovea.api.trip.TripDailyStatsDTO
import java.time.LocalDate

class TripRepository(private val dorisJdbiContext: DorisJdbiContext) {

    fun findById(tripId: String): TripDTO? {
        return dorisJdbiContext.jdbi.withHandle<TripDTO, Exception> { handle ->
            handle.createQuery(
                """
                SELECT 
                    vehicle_id, 
                    trip_id,
                    last_compute_date,
                    start_time,
                    end_time,
                    distance,
                    duration,
                    datapoint_count,
                    s2_longitude(start_location) AS start_lng,
                    s2_latitude(start_location) AS start_lat,
                    s2_longitude(end_location) AS end_lng,
                    s2_latitude(end_location) AS end_lat,
                    idle_duration,
                    idle_count,
                    trip_status,
                    st_astext(st_geometryfromwkb(trace)) as trace 
                FROM trips_vehicle_view 
                WHERE trip_id = :tripId
                """.trimIndent()
            )
                .bind("tripId", tripId)
                .mapTo(TripDTO::class.java)
                .findOne()
                .orElse(null)
        }
    }

    fun findByVehicleId(vehicleId: String): List<TripDTO> {
        return dorisJdbiContext.jdbi.withHandle<List<TripDTO>, Exception> { handle ->
            handle.createQuery(
                """
                SELECT 
                    vehicle_id, 
                    trip_id,
                    last_compute_date,
                    start_time,
                    end_time,
                    distance,
                    duration,
                    datapoint_count,
                    s2_longitude(start_location) AS start_lng,
                    s2_latitude(start_location) AS start_lat,
                    s2_longitude(end_location) AS end_lng,
                    s2_latitude(end_location) AS end_lat,
                    idle_duration,
                    idle_count,
                    trip_status,
                    st_astext(st_geometryfromwkb(trace)) as trace 
                FROM trips_vehicle_view 
                WHERE coalesce(vehicle_id, '') = :vehicleId
            """.trimIndent()
            )
                .bind("vehicleId", vehicleId)
                .mapTo(TripDTO::class.java)
                .list()
        }
    }

    fun findByVehicleIdAndDate(vehicleId: String, date: LocalDate): List<TripDTO> {
        return dorisJdbiContext.jdbi.withHandle<List<TripDTO>, Exception> { handle ->
            handle.createQuery(
                """
                    SELECT 
                        vehicle_id, 
                        trip_id,
                        last_compute_date,
                        start_time,
                        end_time,
                        distance,
                        duration,
                        datapoint_count,
                        s2_longitude(start_location) AS start_lng,
                        s2_latitude(start_location) AS start_lat,
                        s2_longitude(end_location) AS end_lng,
                        s2_latitude(end_location) AS end_lat,
                        idle_duration,
                        idle_count,
                        trip_status,
                        st_astext(st_geometryfromwkb(trace)) as trace 
                    FROM trips_vehicle_view 
                    WHERE coalesce(vehicle_id, '') = :vehicleId 
                    AND date_trunc(start_time, 'day') = :date
                    ORDER BY start_time
                """.trimIndent()
            )
                .bind("vehicleId", vehicleId)
                .bind("date", date)
                .mapTo(TripDTO::class.java)
                .list()
        }
    }

    fun aggregateDailyStats(): List<TripDailyStatsDTO> {
        return dorisJdbiContext.jdbi.withHandle<List<TripDailyStatsDTO>, Exception> { handle ->
            handle.createQuery(
                """
                    SELECT vehicle_id, sum(distance) as distance, min(start_time) as first_trip_start
                    FROM trips_vehicle_view
                    WHERE date(start_time) = date(now()) and vehicle_id is not null
                    GROUP BY vehicle_id, date(start_time)
                """.trimIndent()
            )
                .mapTo(TripDailyStatsDTO::class.java)
                .list()
        }

    }
}