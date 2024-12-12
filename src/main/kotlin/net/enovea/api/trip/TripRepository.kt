package net.enovea.repository

import net.enovea.DorisJdbiContext
import net.enovea.api.trip.TripDTO
import net.enovea.api.trip.TripDailyStatsDTO
import java.time.LocalDate

class TripRepository(private val dorisJdbiContext: DorisJdbiContext) {

    // todo : replace "trips_test_smarty_plan" with "trips_vehicle_view"

    fun findById(tripId: String): TripDTO? {
        return dorisJdbiContext.jdbi.withHandle<TripDTO, Exception> { handle ->
            handle.createQuery("SELECT *, st_astext(st_geometryfromwkb(trace)) as wkt_trace FROM trips_test_smarty_plan WHERE trip_id = :tripId")
                .bind("tripId", tripId)
                .mapTo(TripDTO::class.java)
                .findOne()
                .orElse(null)
        }
    }

    fun findByVehicleId(vehicleId: String): List<TripDTO> {
        return dorisJdbiContext.jdbi.withHandle<List<TripDTO>, Exception> { handle ->
            handle.createQuery("SELECT *, st_astext(st_geometryfromwkb(trace)) as wkt_trace FROM trips_test_smarty_plan WHERE vehicle_id = :vehicleId")
                .bind("vehicleId", vehicleId)
                .mapTo(TripDTO::class.java)
                .list()
        }
    }

    fun findByVehicleIdAndDate(vehicleId: String, date: LocalDate): List<TripDTO> {
        return dorisJdbiContext.jdbi.withHandle<List<TripDTO>, Exception> { handle ->
            handle.createQuery(
                """
                    SELECT *, st_astext(st_geometryfromwkb(trace)) as wkt_trace 
                    FROM trips_test_smarty_plan 
                    WHERE vehicle_id = :vehicleId 
                    AND date_trunc(start_date, 'day') = :date
                    ORDER BY start_date
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
                    SELECT vehicle_id, sum(distance) as distance, min(start_date) as first_trip_start
                    FROM trips_test_smarty_plan
                    GROUP BY vehicle_id, date(start_date)
                    WHERE date(start_date) = date(now())
                """.trimIndent()
            )
                .mapTo(TripDailyStatsDTO::class.java)
                .list()
        }

    }
}