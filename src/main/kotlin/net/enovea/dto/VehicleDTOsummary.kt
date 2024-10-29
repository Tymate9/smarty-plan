package net.enovea.dto


data class VehicleDTOsummary (
    val id: String,
    val licenseplate:String,
    val category: VehicleCategoryDTO,
    val driver: DriverDTO?,
    val device: DeviceDTOsummary,
    val team: TeamDTOsummary,
)