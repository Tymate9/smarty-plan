package net.enovea.vehicle.vehicleStats

import net.enovea.DorisJdbiContext

class VehicleStatsRepository(private val dorisJdbiContext: DorisJdbiContext) {

    //This function returns trips statistics data based on a specific period and applied filters.
    fun findVehicleStatsOverSpecificPeriod(
        startDate: String,
        endDate: String,
        teamLabels: List<String>? = null,
        vehicleIds: List<String>? = null,
        driversIds: List<String>? = null
    ): List<VehicleStatsDTO> {
        return dorisJdbiContext.jdbi.withHandle<List<VehicleStatsDTO>, Exception> { handle ->
            handle.createQuery(
                """
                    SELECT
                        vehicle_id,
                        ARRAY_JOIN(ARRAY_AGG(DISTINCT driver_name), ', ') AS driver_name,
                        license_plate,
                        :startDate AS trip_date,
                        SUM(trip_count) AS trip_count,
                        ROUND(SUM(distance_sum)/1000) AS distance_sum,
                        CONCAT(LPAD(CAST(FLOOR(SUM(duration_sum) / 3600) AS STRING), 2, '0'), ':', LPAD(CAST(FLOOR((SUM(duration_sum) % 3600) / 60) AS STRING), 2, '0')) AS driving_time,
                        ROUND((SUM(distance_sum) / SUM(trip_count))/1000) AS distance_per_trip_avg,
                        CONCAT( LPAD(CAST(FLOOR(SUM(duration_sum) / SUM(trip_count) / 3600) AS STRING), 2, '0'), ':',LPAD(CAST(FLOOR((SUM(duration_sum) / SUM(trip_count)) % 3600 / 60) AS STRING), 2, '0')) AS duration_per_trip_avg,
                        SUM(has_late_start) AS has_late_start_sum,
                        SUM(has_late_stop) AS has_late_stop_sum,
                        SUM(has_last_trip_long) AS has_last_trip_long_sum,
                        CONCAT(
                            LPAD(CAST(FLOOR(AVG(`range`) / 3600) AS STRING), 2, '0'), ':',
                            LPAD(CAST(FLOOR((AVG(`range`) % 3600) / 60) AS STRING), 2, '0')
                        ) AS range_avg,
                        CONCAT(
                            LPAD(CAST(FLOOR(SUM(`range` - duration_sum) / 3600) AS STRING), 2, '0'), ':',
                            LPAD(CAST(FLOOR((SUM(`range` - duration_sum) % 3600) / 60) AS STRING), 2, '0')
                        ) AS waiting_duration
                    
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
                        WHERE DATE(start_time) = DATE(end_time)
                          AND DATE(start_time) BETWEEN :startDate AND :endDate
                          AND vehicle_id IS NOT NULL

                           ${
                    if (!teamLabels.isNullOrEmpty() && !vehicleIds.isNullOrEmpty() && !driversIds.isNullOrEmpty()) {
                        "AND (team_label IN (<teamLabels>) OR parent_team_label IN (<teamLabels>))" +
                                " AND (license_plate IN (<vehicleIds>) OR driver_name IN (<driversIds>))"
                    } else {
                        var conditions = mutableListOf<String>()
                        if (!teamLabels.isNullOrEmpty()) {
                            conditions.add("AND (team_label IN (<teamLabels>) OR parent_team_label IN (<teamLabels>))")
                        }
                        if (!vehicleIds.isNullOrEmpty()) {
                            conditions.add("AND license_plate IN (<vehicleIds>)")
                        }
                        if (!driversIds.isNullOrEmpty()) {
                            val hasUnassignedSentinel = driversIds.contains("Véhicule non attribué")
                            val realDriverNames = driversIds.filter { it != "Véhicule non attribué" }
                            when {
                                hasUnassignedSentinel && realDriverNames.isNotEmpty() -> {
                                    conditions.add("AND (driver_name IN (<driversIds>) OR driver_name IS NULL)")
                                }

                                hasUnassignedSentinel -> {
                                    conditions.add("AND driver_name IS NULL")
                                }

                                else -> {
                                    conditions.add("AND driver_name IN (<driversIds>)")
                                }
                            }
                        }
                        conditions.joinToString(" ")
                    }
                }
                        GROUP BY vehicle_id, date(start_time), driver_name , license_plate
                         ) daily
                    GROUP BY vehicle_id , license_plate ;
                """.trimIndent()
            )
                .bind("startDate", startDate)
                .bind("endDate", endDate)
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

    fun findVehicleDailyStats(
        startDate: String, endDate: String, vehicleId: String
    ): List<VehicleStatsDTO> {
        return dorisJdbiContext.jdbi.withHandle<List<VehicleStatsDTO>, Exception> { handle ->
            handle.createQuery(
                """
                    SELECT  
                            DATE(start_time) AS trip_date,
                            vehicle_id,
                            driver_name,
                            license_plate,
                            COUNT(*) AS trip_count,
                            ROUND(SUM(distance)/1000) AS distance_sum,
                            CONCAT(LPAD(CAST(FLOOR(SUM(duration) / 3600) AS STRING), 2, '0'), ':', LPAD(CAST(FLOOR((SUM(duration) % 3600) / 60) AS STRING), 2, '0')) AS driving_time,
                            ROUND((SUM(distance) / COUNT(*))/1000) AS distance_per_trip_avg,
                            CONCAT( LPAD(CAST(FLOOR(SUM(duration) / COUNT(*) / 3600) AS STRING), 2, '0'), ':',LPAD(CAST(FLOOR((SUM(duration) / COUNT(*)) % 3600 / 60) AS STRING), 2, '0')) AS duration_per_trip_avg,
                            CONCAT(
                                LPAD(CAST(FLOOR(time_to_sec(timediff(MAX(end_time), MIN(start_time))) / 3600) AS STRING), 2, '0'), ':',
                                LPAD(CAST(FLOOR((time_to_sec(timediff(MAX(end_time), MIN(start_time))) % 3600) / 60) AS STRING), 2, '0')
                            ) AS range_avg,
                            hour(minutes_add(MIN(start_time), 30)) >= 8 AS has_late_start_sum,
                            hour(MAX(end_time)) > 18 AS has_late_stop_sum,
                            TIMESTAMPDIFF(MINUTE,max(end_time),max(start_time)) > 45 AS has_last_trip_long_sum,
                            CONCAT(
                                LPAD(CAST(FLOOR((TIME_TO_SEC(TIMEDIFF(MAX(end_time), MIN(start_time))) - SUM(duration)) / 3600) AS STRING), 2, '0'), ':',
                                LPAD(CAST(FLOOR(((TIME_TO_SEC(TIMEDIFF(MAX(end_time), MIN(start_time))) - SUM(duration)) % 3600) / 60) AS STRING), 2, '0')
                            ) AS waiting_duration
                    
                        FROM trips_vehicle_team_view
                        WHERE DATE(start_time) = DATE(end_time)
                          AND DATE(start_time) BETWEEN :startDate AND :endDate
                          AND vehicle_id IS NOT NULL
                          AND vehicle_id = :vehicleId
                        GROUP BY vehicle_id, date(start_time), driver_name , license_plate
                        ORDER BY trip_date
                        ;
                """.trimIndent()
            )
                .bind("startDate", startDate)
                .bind("endDate", endDate)
                .bind("vehicleId", vehicleId)
                .mapTo(VehicleStatsDTO::class.java)
                .list()
        }
    }


//function returns data of QSE report
    fun findVehicleStatsQSEOverSpecificPeriod(
        startDate: String,
        endDate: String,
        teamLabels: List<String>? = null,
        vehicleIds: List<String>? = null,
        driversIds: List<String>? = null
    ): List<VehicleStatsQseDTO> {
        return dorisJdbiContext.jdbi.withHandle<List<VehicleStatsQseDTO>, Exception> { handle ->
            handle.createQuery(
                """
                    SELECT
                        vehicle_id,
                        ARRAY_JOIN(ARRAY_AGG(DISTINCT driver_name), ', ') AS driver_name,
                        license_plate,
                        ROUND(MAX(longest_trip_distance_daily)/1000) AS longest_trip_distance,
                        SUM(trip_count) AS trip_count,
                        :startDate AS trip_date,      
                        ROUND(SUM(distance_sum)/1000) AS distance_sum,
                        CONCAT( LPAD(CAST(FLOOR(SUM(duration_sum) / SUM(trip_count) / 3600) AS STRING), 2, '0'), ':',LPAD(CAST(FLOOR((SUM(duration_sum) / SUM(trip_count)) % 3600 / 60) AS STRING), 2, '0')) AS duration_per_trip_avg,
                        CONCAT(LPAD(CAST(FLOOR(SUM(duration_sum) / 3600) AS STRING), 2, '0'), ':', LPAD(CAST(FLOOR((SUM(duration_sum) % 3600) / 60) AS STRING), 2, '0')) AS driving_time,
                        CONCAT(
                            LPAD(CAST(FLOOR(SUM(`range` - duration_sum) / 3600) AS STRING), 2, '0'), ':',
                            LPAD(CAST(FLOOR((SUM(`range` - duration_sum) % 3600) / 60) AS STRING), 2, '0')
                        ) AS waiting_duration,
                        CONCAT(
                            LPAD(CAST(FLOOR(AVG(`range`) / 3600) AS STRING), 2, '0'), ':',
                            LPAD(CAST(FLOOR((AVG(`range`) % 3600) / 60) AS STRING), 2, '0')
                        ) AS range_avg,
                        CONCAT(
                            LPAD(CAST(FLOOR(SUM(daily_idle_duration) / 3600) AS STRING), 2, '0'), 
                            ':',
                            LPAD(CAST(FLOOR((SUM(daily_idle_duration) % 3600) / 60) AS STRING), 2, '0')
                        ) AS idle_duration
                    FROM (
                        SELECT
                            vehicle_id,
                            driver_name,
                            license_plate,
                            COUNT(*) AS trip_count,
                            MAX(distance) As longest_trip_distance_daily,
                            SUM(distance) AS distance_sum,
                            SUM(duration) AS duration_sum,
                            time_to_sec(timediff(max(end_time), min(start_time))) AS `range`,
                            SUM(idle_duration) As daily_idle_duration
                            
                        FROM trips_vehicle_team_view
                        WHERE DATE(start_time) = DATE(end_time)
                          AND DATE(start_time) BETWEEN :startDate AND :endDate
                          AND vehicle_id IS NOT NULL

                           ${
                    if (!teamLabels.isNullOrEmpty() && !vehicleIds.isNullOrEmpty() && !driversIds.isNullOrEmpty()) {
                        "AND (team_label IN (<teamLabels>) OR parent_team_label IN (<teamLabels>))" +
                                " AND (license_plate IN (<vehicleIds>) OR driver_name IN (<driversIds>))"
                    } else {
                        var conditions = mutableListOf<String>()
                        if (!teamLabels.isNullOrEmpty()) {
                            conditions.add("AND (team_label IN (<teamLabels>) OR parent_team_label IN (<teamLabels>))")
                        }
                        if (!vehicleIds.isNullOrEmpty()) {
                            conditions.add("AND license_plate IN (<vehicleIds>)")
                        }
                        if (!driversIds.isNullOrEmpty()) {
                            val hasUnassignedSentinel = driversIds.contains("Véhicule non attribué")
                            val realDriverNames = driversIds.filter { it != "Véhicule non attribué" }
                            when {
                                hasUnassignedSentinel && realDriverNames.isNotEmpty() -> {
                                    conditions.add("AND (driver_name IN (<driversIds>) OR driver_name IS NULL)")
                                }

                                hasUnassignedSentinel -> {
                                    conditions.add("AND driver_name IS NULL")
                                }

                                else -> {
                                    conditions.add("AND driver_name IN (<driversIds>)")
                                }
                            }
                        }
                        conditions.joinToString(" ")
                    }
                }
                        GROUP BY vehicle_id, date(start_time), driver_name , license_plate
                         ) daily
                    GROUP BY vehicle_id , license_plate ;
                """.trimIndent()
            )
                .bind("startDate", startDate)
                .bind("endDate", endDate)
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
                .mapTo(VehicleStatsQseDTO::class.java)
                .list()
        }
    }




}