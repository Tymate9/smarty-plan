package net.enovea.acceleration

import java.sql.Timestamp

data class DeviceAccelAnglesDTO (
    val deviceId: Int,
    val beginDate: Timestamp,
    val phi: Double?,
    val theta: Double?,
    val psi: Double?,
    val status: DeviceAccelAnglesStatus,
    val computationTime: Timestamp
)