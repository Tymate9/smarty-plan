package net.enovea.vehicle.vehicleStats

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import java.sql.ResultSet

class VehicleStatsQseMapper: RowMapper<VehicleStatsQseQueryResult> {
    override fun map(rs: ResultSet, ctx: StatementContext): VehicleStatsQseQueryResult {
        return VehicleStatsQseQueryResult(
            tripDate = rs.getDate("trip_date")?.toLocalDate(),
            vehicleId = rs.getString("vehicle_id") ?: "No VehicleID",
            distanceSum = rs.getInt("distance_sum").takeIf { !rs.wasNull() },
            highwayDistanceSum = rs.getInt("highway_distance_sum").takeIf { !rs.wasNull() },
            roadDistanceSum = rs.getInt("road_distance_sum").takeIf { !rs.wasNull() },
            cityDistanceSum = rs.getInt("city_distance_sum").takeIf { !rs.wasNull() },
            durationPerTripAvg = rs.getLong("duration_per_trip_avg").takeIf { !rs.wasNull() },
            driverName = rs.getString("driver_name") ?: "Non attribué",
            licensePlate = rs.getString("license_plate") ?: "-",
            waitingDuration = rs.getLong("waiting_duration").takeIf { !rs.wasNull() } ,
            tripCount = rs.getInt("trip_count"),
            drivingTime = rs.getLong("driving_time").takeIf { !rs.wasNull() },
            rangeAvg = rs.getLong("range_avg").takeIf { !rs.wasNull() },
            idleDuration = rs.getLong("idle_duration").takeIf { !rs.wasNull() },
            distanceMax = rs.getInt("longest_trip_distance").takeIf { !rs.wasNull() },
            accelScore = rs.getInt("accel_score").takeIf { !rs.wasNull() },
            turnScore = rs.getInt("turn_score").takeIf { !rs.wasNull() },
            highwayAccelScore = rs.getInt("highway_accel_score").takeIf { !rs.wasNull() },
            roadAccelScore = rs.getInt("road_accel_score").takeIf { !rs.wasNull() },
            cityAccelScore = rs.getInt("city_accel_score").takeIf { !rs.wasNull() },
            highwayTurnScore = rs.getInt("highway_turn_score").takeIf { !rs.wasNull() },
            roadTurnScore = rs.getInt("road_turn_score").takeIf { !rs.wasNull() },
            cityTurnScore = rs.getInt("city_turn_score").takeIf { !rs.wasNull() },
            highwaySpeedScore = rs.getInt("highway_speed_score").takeIf { !rs.wasNull() },
            roadSpeedScore = rs.getInt("road_speed_score").takeIf { !rs.wasNull() },
            citySpeedScore = rs.getInt("city_speed_score").takeIf { !rs.wasNull() },
        )
    }

}