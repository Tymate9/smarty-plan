package net.enovea.dto


import java.sql.Timestamp

data class VehicleDriverDTO (

    val id:VehicleDriverIdDTO,
    val vehicle: VehicleDTO,
    val driver: DriverDTO,
    //var driverName: String?

)
data class VehicleDriverIdDTO(
    val vehicleId: String,
    val driverId: Int,
    val date: Timestamp
)