package net.enovea.repository

import net.enovea.DorisJdbiContext
import net.enovea.api.trip.TripDTO
import java.time.LocalDate

class TripRepository(private val dorisJdbiContext: DorisJdbiContext) {

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
}