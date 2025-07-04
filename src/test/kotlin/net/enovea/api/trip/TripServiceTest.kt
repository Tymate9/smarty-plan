package net.enovea.api.trip

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import net.enovea.poi.PointOfInterestEntity
import net.enovea.vehicle.vehicleStats.VehicleStatsRepository
import net.enovea.spatial.SpatialService
import net.enovea.trip.TripDTO
import net.enovea.trip.TripService
import net.enovea.trip.TripStatus
import java.time.LocalDateTime

class TripServiceTest : StringSpec({

    val tripRepository = mockk<TripRepository>()
    val spatialService = mockk<SpatialService>()
    val vehicleStatsRepository = mockk<VehicleStatsRepository>()
    val tripService = TripService(tripRepository, spatialService)

    "computeTripMapDTO should return correct TripMapDTO" {
        val vehicleId = "1"
        val date = "20230101"

        val trips = listOf(
            TripDTO(
                vehicleId = vehicleId,
                tripId = "1",
                lastComputeDate = LocalDateTime.parse("2020-01-01T00:00:00"),
                startTime = LocalDateTime.parse("2020-01-01T00:00:00"),
                endTime = LocalDateTime.parse("2020-01-01T01:00:00"),
                distance = 10.0,
                duration = 3600,
                datapointCount = 100,
                startLng = 0.0,
                startLat = 0.0,
                endLng = 1.0,
                endLat = 1.0,
                idleCount = 0,
                idleDuration = 0,
                trace = null,
                tripStatus = TripStatus.COMPLETED,
            )
        )

        every { tripRepository.findByVehicleIdAndDate(vehicleId, any()) } returns trips
        every { spatialService.getNearestEntityWithinArea(any(), PointOfInterestEntity :: class) } returns null
        every { spatialService.getAddressFromEntity(any()) } returns "Some Address"

        val result = tripService.computeTripEventsDTO(vehicleId, date).second

        result?.vehicleId shouldBe vehicleId
        result?.tripAmount shouldBe 1
        result?.drivingDistance shouldBe 10.0
        result?.drivingDuration shouldBe 3600
        result?.stopDuration shouldBe 0
        result?.poiAmount shouldBe 0
        result?.tripEvents?.size shouldBe 1
        result?.tripEvents?.get(0)?.address shouldBe "Some Address"
    }
})
