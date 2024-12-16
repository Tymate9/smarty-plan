package net.enovea.dto
import java.time.LocalTime

data class VehicleTableDTO (
    val id: String,
    val energy: String?,
    val engine: String?,
    val externalId: String?,
    val licenseplate:String,
    val category: VehicleCategoryDTO,
    val driver: DriverDTO?,
    val device: DeviceDataDTO,
    var lastPositionAddress: String?,
    var lastPositionAdresseType: String?,
    val team: TeamDTO,
    var distance : Number?,
    var firstTripStart : LocalTime?,
    val teamHierarchy: String? = null
)