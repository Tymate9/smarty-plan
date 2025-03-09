package net.enovea.dto
import net.enovea.api.poi.PointOfInterestCategory.PointOfInterestCategoryEntity
import java.sql.Timestamp
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
    val teamHierarchy: String? = null,
    val ranges: List<Range<VehicleTableDTO>>? = null,
    val lastPositionDate: Timestamp? = null
)