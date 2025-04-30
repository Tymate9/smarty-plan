package net.enovea.acceleration

import io.quarkus.panache.common.Sort
import net.enovea.DorisJdbiContext
import net.enovea.device.deviceVehicle.DeviceVehicleInstallEntity
import net.enovea.vehicle.VehicleEntity
import net.enovea.vehicle.VehicleMapper

class CalibrationService(
    private val vehicleMapper: VehicleMapper,
    private val deviceAccelAnglesMapper: DeviceAccelAnglesMapper
) {
    fun listCalibrationPeriods(): List<VehicleAccelPeriodsDTO> {

        val installsByDevice = DeviceVehicleInstallEntity.listAll().groupBy { it.id.deviceId }

        return DeviceAccelAnglesEntity
            .listAll(sort = Sort.by("id.beginDate"))
            .mapNotNull { calibrationPeriod ->
                val deviceId = calibrationPeriod.id.deviceId
                val beginDate = calibrationPeriod.id.beginDate

                val vehicleEntity = installsByDevice[deviceId]
                    ?.firstOrNull{ it.id.startDate <= beginDate && (it.endDate == null || it.endDate!! > beginDate)}
                    ?.vehicle

                if (vehicleEntity != null) {
                    calibrationPeriod to vehicleEntity
                } else {
                    //TODO
                    null
                } }
            .groupBy { it.second.id }
            .map { (_, listPairs) ->
                val vehicle = vehicleMapper.toVehicleDTO(listPairs.first().second).copy(
                    drivers = null,
                    devices = null,
                    teams = null,
                    ranges = null)
                val periods = listPairs.map { deviceAccelAnglesMapper.toDto(it.first) }
                VehicleAccelPeriodsDTO(vehicle, periods)
            }
    }
}