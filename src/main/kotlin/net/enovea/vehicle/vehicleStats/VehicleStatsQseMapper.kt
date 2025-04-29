package net.enovea.vehicle.vehicleStats

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import java.sql.ResultSet

class VehicleStatsQseMapper: RowMapper<VehicleStatsQseDTO> {
    override fun map(rs: ResultSet, ctx: StatementContext): VehicleStatsQseDTO {
        return VehicleStatsQseDTO(
            tripDate = rs.getDate("trip_date")?.toLocalDate(),
            vehicleId = rs.getString("vehicle_id") ?: "No VehicleID",
            distanceSum = rs.getInt("distance_sum").takeIf { !rs.wasNull() },
            durationPerTripAvg = rs.getString("duration_per_trip_avg").takeIf { !rs.wasNull() },
            driverName = rs.getString("driver_name") ?: "Non attribué",
            licensePlate = rs.getString("license_plate") ?: "-",
            waitingDuration = rs.getString("waiting_duration").takeIf { !rs.wasNull() } ,
            tripCount = rs.getInt("trip_count"),
            drivingTime = rs.getString("driving_time").takeIf { !rs.wasNull() },
            rangeAvg = rs.getString("range_avg"),
            idleDuration = rs.getString("idle_duration").takeIf { !rs.wasNull() },
            distanceMax = rs.getInt("longest_trip_distance").takeIf { !rs.wasNull() },
            highwayAccelScore = rs.getInt("highway_accel_score"),
            roadAccelScore = rs.getInt("road_accel_score"),
            cityAccelScore = rs.getInt("city_accel_score"),
            highwayTurnScore = rs.getInt("highway_turn_score"),
            roadTurnScore = rs.getInt("road_turn_score"),
            cityTurnScore = rs.getInt("city_turn_score"),
            highwaySpeedScore = rs.getInt("highway_speed_score"),
            roadSpeedScore = rs.getInt("road_speed_score"),
            citySpeedScore = rs.getInt("city_speed_score"),
        )
    }

}