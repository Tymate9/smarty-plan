package net.enovea.acceleration

import java.time.LocalDateTime

data class DeviceAccelAnglesDTO (
    val deviceId: Int,
    val beginDate: LocalDateTime,
    val phi: Double?,
    val theta: Double?,
    val psi: Double?,
    val status: DeviceAccelAnglesStatus,
    val computationTime: LocalDateTime,
)