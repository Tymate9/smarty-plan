package net.enovea

import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockkObject
import net.enovea.api.poi.PointOfInterestEntity
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class PointOfInterestEntityTest {
    @BeforeEach
    fun beforeEach() {
        mockkObject(PointOfInterestEntity.Companion)
        every { PointOfInterestEntity.listAll() } returns listOf(
            PointOfInterestEntity(
                radius = 100
            ),
            PointOfInterestEntity(
                radius = 90
            ),
            PointOfInterestEntity(
                radius = 110
            )
        )

    }

    @Test
    fun test_getAllWithLittleRadius() {
        PointOfInterestEntity.getAllWithLittleRadius() shouldBe listOf(
            PointOfInterestEntity(
                radius = 90
            )
        )
    }
}