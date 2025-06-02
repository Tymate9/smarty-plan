package net.enovea.acceleration

import io.github.oshai.kotlinlogging.KotlinLogging
import io.quarkus.panache.common.Sort
import jakarta.ws.rs.NotFoundException
import net.enovea.device.deviceVehicle.DeviceVehicleInstallEntity
import net.enovea.vehicle.VehicleMapper
import java.time.LocalDateTime

class CalibrationService(
    private val vehicleMapper: VehicleMapper,
    private val deviceAccelAnglesMapper: DeviceAccelAnglesMapper
) {
    val logger = KotlinLogging.logger {  }

    fun listCalibrationPeriods(): List<VehicleAccelPeriodsDTO> {
        val installsByDevice = DeviceVehicleInstallEntity.listAll().groupBy { it.id.deviceId }

        return DeviceAccelAnglesEntity
            .listAll(sort = Sort.by("id.beginDate"))
            .mapNotNull { calibrationPeriod ->
                val deviceId = calibrationPeriod.id.deviceId
                val beginDate = calibrationPeriod.id.beginDate

                val vehicleEntity = installsByDevice[deviceId]
                    ?.firstOrNull{ it.id.startDate.toLocalDateTime() <= beginDate && (it.endDate == null || it.endDate!!.toLocalDateTime() > beginDate)}
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

    fun saveAngles(deviceId: Int, beginDate: LocalDateTime, phi: Double, theta: Double, psi: Double): DeviceAccelAnglesDTO {
        val entity = DeviceAccelAnglesEntity.findById(DeviceAccelAnglesId(deviceId, beginDate))
            ?: throw NotFoundException()

        entity.phi = phi
        entity.theta = theta
        entity.psi = psi
        entity.status = DeviceAccelAnglesStatus.MANUAL
        entity.computationTime = LocalDateTime.now()
        logger.info { "angles updated for device ${deviceId} for period at ${beginDate}" }
        return deviceAccelAnglesMapper.toDto(entity)
    }
}