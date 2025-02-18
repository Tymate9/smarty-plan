package net.enovea.api.trip

import net.enovea.DorisJdbiContext
import java.time.LocalDate
import java.time.LocalDateTime

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
                AND duration > 60
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
                AND duration > 60
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
                AND duration > 60
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

    fun findDataPointIndexCloseToTime(
        deviceId: String,
        tripId: String,
        referenceTime: LocalDateTime,
        before: Boolean
    ): Int? {
        return dorisJdbiContext.jdbi.withHandle<Int?, Exception> { handle ->
            // 1) Construction de la requête selon before = true/false
            val query = if (before) {
                // Dernier point dont timestamp <= referenceTime
                """
            SELECT point_index
            FROM datapoint
            WHERE device_id = :deviceId
              AND trip_id = :tripId
              AND timestamp <= :referenceTime
            ORDER BY timestamp DESC
            LIMIT 1
            """.trimIndent()
            } else {
                // Premier point dont timestamp >= referenceTime
                """
            SELECT point_index
            FROM datapoint
            WHERE device_id = :deviceId
              AND trip_id = :tripId
              AND timestamp >= :referenceTime
            ORDER BY timestamp ASC
            LIMIT 1
            """.trimIndent()
            }

            // 2) Exécution de la requête
            handle.createQuery(query)
                .bind("deviceId", deviceId)
                .bind("tripId", tripId)
                .bind("referenceTime", referenceTime)
                .mapTo(Int::class.java)
                .findOne()
                .orElse(null)
        }
    }

}