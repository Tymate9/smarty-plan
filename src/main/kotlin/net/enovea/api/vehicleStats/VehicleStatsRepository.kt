package net.enovea.api.vehicleStats

import net.enovea.DorisJdbiContext

class VehicleStatsRepository(private val dorisJdbiContext: DorisJdbiContext) {

    fun findVehicleStatsOverSpecificPeriod(startDate: String, endDate: String ,teamLabels: List<String>? = null , vehicleIds: List<String>? = null , driversIds:List<String>? =null ): List<VehicleStatsDTO> {
        return dorisJdbiContext.jdbi.withHandle<List<VehicleStatsDTO>, Exception> { handle ->
            handle.createQuery(
                """
                    SELECT
                        vehicle_id,
                        driver_name,
                        license_plate,
                        SUM(trip_count) AS trip_count,
                        SUM(distance_sum) AS distance_sum,
                        SUM(duration_sum) AS driving_time,
                        SUM(distance_sum) / SUM(trip_count) AS distance_per_trip_avg,
                        SUM(duration_sum) /SUM(trip_count) AS duration_per_trip_avg,
                        SUM(has_late_start) AS has_late_start_sum,
                        SUM(has_late_stop) AS has_late_stop_sum,
                        SUM(has_last_trip_long) AS has_last_trip_long_sum,
                        AVG(`range`) AS range_avg,
                        SUM(`range`-duration_sum) AS waiting_duration
                    
                    FROM (
                        SELECT
                            vehicle_id,
                            driver_name,
                            license_plate,
                            COUNT(*) AS trip_count,
                            SUM(distance) AS distance_sum,
                            SUM(duration) AS duration_sum,
                            time_to_sec(timediff(max(end_time), min(start_time))) AS `range`,
                            hour(minutes_add(MIN(start_time), 30)) >= 8 AS has_late_start,
                            hour(MAX(end_time)) > 18 AS has_late_stop,
                            TIMESTAMPDIFF(MINUTE,max(end_time),max(start_time)) > 45 AS has_last_trip_long
                    
                        FROM trips_vehicle_team_view
                        WHERE DATE(start_time) = date(end_time)
                          AND DATE(start_time) BETWEEN :startDate AND :endDate
                          AND vehicle_id IS NOT NULL
                          ${if (teamLabels.isNullOrEmpty()) "" else "AND team_label IN (<teamLabels>)"}
                          ${if (vehicleIds.isNullOrEmpty()) "" else "AND license_plate IN (<vehicleIds>)"}
                          ${if (driversIds.isNullOrEmpty()) "" else "AND driver_name IN (<driversIds>)"}
                        GROUP BY vehicle_id, date(start_time), driver_name , license_plate
                         ) daily
                    GROUP BY vehicle_id , driver_name , license_plate ;
                """.trimIndent()
            )
                .bind("startDate", startDate)
                .bind("endDate",endDate)
                .apply {
                    if (!teamLabels.isNullOrEmpty()) {
                        bindList("teamLabels", teamLabels)
                    }
                    if (!vehicleIds.isNullOrEmpty()) {
                        bindList("vehicleIds", vehicleIds)
                    }
                    if (!driversIds.isNullOrEmpty()) {
                        bindList("driversIds", driversIds)
                    }
                }
                .mapTo(VehicleStatsDTO::class.java)
                .list()
        }
    }
}