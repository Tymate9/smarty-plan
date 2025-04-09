package net.enovea.vehicle.vehicleStats

import org.jdbi.v3.core.statement.StatementContext
import java.sql.ResultSet
import org.jdbi.v3.core.mapper.RowMapper

class VehicleStatsMapper: RowMapper<VehicleStatsDTO>{
     override fun map(rs: ResultSet , ctx: StatementContext): VehicleStatsDTO {
        return VehicleStatsDTO(
            tripDate = rs.getDate("trip_date")?.toLocalDate(),
            vehicleId = rs.getString("vehicle_id") ?: "No VehicleID",
            tripCount = rs.getInt("trip_count"),
            distanceSum = rs.getInt("distance_sum").takeIf { !rs.wasNull() },
            drivingTime = rs.getString("driving_time").takeIf { !rs.wasNull() },
            distancePerTripAvg = rs.getInt("distance_per_trip_avg").takeIf { !rs.wasNull() },
            durationPerTripAvg = rs.getString("duration_per_trip_avg").takeIf { !rs.wasNull() },
            hasLateStartSum = rs.getInt("has_late_start_sum"),
            hasLateStop = rs.getInt("has_late_stop_sum"),
            hasLastTripLong = rs.getInt("has_last_trip_long_sum"),
            rangeAvg = rs.getString("range_avg"),
            waitingDuration = rs.getString("waiting_duration").takeIf { !rs.wasNull() } ,
            driverName = rs.getString("driver_name") ?: "Non attribué",
            licensePlate = rs.getString("license_plate") ?: "-",
        )
    }

}