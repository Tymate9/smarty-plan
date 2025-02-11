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
        )
    }

}