package net.enovea.vehicle.vehicleTable
import net.enovea.device.deviceData.DeviceDataDTO
import net.enovea.driver.DriverDTO
import net.enovea.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import net.enovea.team.TeamDTO
import net.enovea.vehicle.vehicle_category.VehicleCategoryDTO
import java.time.LocalTime


data class VehicleTableDTO (
    val id: String,
    val energy: String?,
    val engine: String?,
    val externalId: String?,
    val licenseplate:String,
    val category: VehicleCategoryDTO,
    val driver: DriverDTO?,
    val device: DeviceDataDTO, //TODO can be null ?
    var lastPositionAddress: String?,
    var lastPositionAddressInfo:  PointOfInterestCategoryEntity?,
    val team: TeamDTO,
    var distance : Number?,
    var firstTripStart : LocalTime?,
    val teamHierarchy: String? = null
)