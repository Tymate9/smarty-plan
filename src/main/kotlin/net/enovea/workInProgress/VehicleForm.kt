package net.enovea.workInProgress

import net.enovea.vehicle.vehicle_category.VehicleCategoryDTO

data class VehicleForm (
    var id: Int? = null,
    var energy: String? = null,
    var engine: String? = null,
    var externalid: String,
    var licenseplate: String,
    var category: VehicleCategoryDTO,
    var validated: Boolean = false
)