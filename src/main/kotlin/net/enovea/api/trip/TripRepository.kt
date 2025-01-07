package net.enovea.repository

import net.enovea.DorisJdbiContext
import net.enovea.api.trip.TripDTO
import net.enovea.api.trip.TripDailyStatsDTO
import java.time.LocalDate

class TripRepository(private val dorisJdbiContext: DorisJdbiContext) {
    // todo : replace raw timezone computation with timezone field

    fun findById(tripId: String): TripDTO? {
        return dorisJdbiContext.jdbi.withHandle<TripDTO, Exception> { handle ->
            handle.createQuery(
                """
                SELECT 
                    vehicle_id, 
                    trip_id,
                    coalesce(minutes_add(last_compute_date, tz_offset * 10), convert_tz(last_compute_date, 'UTC', 'Europe/Paris')) as last_compute_date,
                    coalesce(minutes_add(start_time, tz_offset * 10), convert_tz(start_time, 'UTC', 'Europe/Paris')) as start_time,
                    coalesce(minutes_add(end_time, tz_offset * 10), convert_tz(end_time, 'UTC', 'Europe/Paris')) as end_time,
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
                    coalesce(minutes_add(last_compute_date, tz_offset * 10), convert_tz(last_compute_date, 'UTC', 'Europe/Paris')) as last_compute_date,
                    coalesce(minutes_add(start_time, tz_offset * 10), convert_tz(start_time, 'UTC', 'Europe/Paris')) as start_time,
                    coalesce(minutes_add(end_time, tz_offset * 10), convert_tz(end_time, 'UTC', 'Europe/Paris')) as end_time,
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
                    coalesce(minutes_add(last_compute_date, tz_offset * 10), convert_tz(last_compute_date, 'UTC', 'Europe/Paris')) as last_compute_date,
                    coalesce(minutes_add(start_time, tz_offset * 10), convert_tz(start_time, 'UTC', 'Europe/Paris')) as start_time,
                    coalesce(minutes_add(end_time, tz_offset * 10), convert_tz(end_time, 'UTC', 'Europe/Paris')) as end_time,
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
                    SELECT 
                        vehicle_id, 
                        sum(distance) as distance, 
                        coalesce(minutes_add(min(start_time), min_by(tz_offset, start_time) * 10), convert_tz(min(start_time), 'UTC', 'Europe/Paris')) as first_trip_start
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