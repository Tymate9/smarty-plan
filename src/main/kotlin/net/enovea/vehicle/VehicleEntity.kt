package net.enovea.vehicle

import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import jakarta.transaction.Transactional
import net.enovea.poi.PointOfInterestEntity.Companion.ID_SEQUENCE
import net.enovea.device.DeviceEntity
import net.enovea.device.deviceVehicle.DeviceVehicleInstallEntity
import net.enovea.driver.DriverEntity
import net.enovea.vehicle.vehicle_category.VehicleCategoryEntity
import net.enovea.vehicle.vehicleDriver.VehicleDriverEntity
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import java.time.LocalDate

/**
 * Représente un véhicule
 **/

@Entity(name = VehicleEntity.ENTITY_NAME)
@Table(name = VehicleEntity.TABLE_NAME)
data class VehicleEntity(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @SequenceGenerator(name = ID_SEQUENCE, sequenceName = ID_SEQUENCE, allocationSize = 1)
    var id: String? = "",

    @Column(name = "energy", nullable = true)
    var energy: String? = null,

    @Column(name = "engine", nullable = true)
    var engine: String? = null,

    @Column(name = "externalid", nullable = true)
    var externalId: String? = null,

    @Column(name = "licenseplate", nullable = false)
    var licenseplate: String = "",

    @Column(name = "validated", nullable = false)
    var validated: Boolean = false,


    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "vehicle",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
        )
    val vehicleDevices: List<DeviceVehicleInstallEntity> = mutableListOf(),

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "vehicle",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
        )
    val vehicleDrivers: List<VehicleDriverEntity> = mutableListOf(),

    @OneToMany(
        fetch = FetchType.LAZY,
        mappedBy = "vehicle",
        cascade = [CascadeType.ALL, CascadeType.REMOVE]
        )
    val vehicleTeams: List<VehicleTeamEntity> = mutableListOf(),

    @ManyToOne
    @JoinColumn(name = "category_id")
    var category: VehicleCategoryEntity? = null,


    ) : PanacheEntityBase {

    fun retrieveVehicleDrivers(): List<VehicleDriverEntity> {
        return vehicleDrivers
    }
    companion object : PanacheCompanionBase<VehicleEntity, String> {
        const val ENTITY_NAME = "VehicleEntity"
        const val TABLE_NAME = "vehicle"
        private const val BASE_QUERY = """
            SELECT v
            FROM VehicleEntity v
            JOIN FETCH VehicleTeamEntity vt ON v.id = vt.id.vehicleId
            JOIN FETCH TeamEntity t ON vt.id.teamId = t.id
            LEFT JOIN t.parentTeam parent_team
            LEFT JOIN FETCH VehicleDriverEntity vd ON v.id = vd.id.vehicleId
                AND vd.id.startDate <= current_date()
                AND (vd.endDate IS NULL OR vd.endDate >= current_date())   
            LEFT JOIN FETCH DriverEntity d ON vd.id.driverId = d.id
            JOIN FETCH DeviceVehicleInstallEntity dvi ON v.id = dvi.id.vehicleId
                AND dvi.id.startDate <= current_date()
                AND (dvi.endDate IS NULL OR dvi.endDate >= current_date())   
            JOIN FETCH DeviceEntity de ON dvi.id.deviceId = de.id
            LEFT JOIN FETCH DeviceDataStateEntity ds ON de.id = ds.device_id 
            LEFT JOIN VehicleUntrackedPeriodEntity vup 
                ON vup.id.vehicleId = v.id 
                AND vup.id.startDate <= current_date()
                AND (vup.endDate IS NULL OR vup.endDate >= current_date())    
            LEFT JOIN DriverUntrackedPeriodEntity dup 
                ON dup.id.driverId = d.id 
                AND dup.id.startDate <= current_date() 
                AND (dup.endDate IS NULL OR dup.endDate >= current_date()) 
            WHERE 1 = 1
            AND vt.endDate IS NULL
            AND vd.endDate IS NULL
            """
        private const val GEOLOCALIZED_CONDITION = """
            AND vup.id.startDate IS NULL
            AND dup.id.startDate IS NULL
            """
        private const val NON_GEOLOCALIZED_CONDITION = """
            AND (
                vup.id.startDate IS NOT NULL
                OR dup.id.startDate IS NOT NULL
            )
            """

        fun getCurrentDriver(vehicleDriversList: List<VehicleDriverEntity>): DriverEntity? = vehicleDriversList.filter { it.endDate == null }.maxByOrNull { it.id.startDate }?.driver

        fun getCurrentDevice(vehicleDevicesList: List<DeviceVehicleInstallEntity>): DeviceEntity? = vehicleDevicesList.filter { it.endDate == null }.maxByOrNull { it.id.startDate }?.device

        // Method to find by ID as String
        @Transactional
        fun findByIdString(id: String): VehicleEntity? {
            return find("id = ?1", id).firstResult()
        }

        // Query to fetch vehicles with drivers
        @Transactional
        fun findAllWithDrivers(): List<VehicleEntity> {
            return find(
                query = "SELECT v FROM VehicleEntity v " +
                        "JOIN FETCH v.VehicleDriverEntity vd " +
                        "JOIN FETCH vd.DriverEntity"
            ).list()
        }

        data class VehicleAndCurrentDriver(val vehicle: VehicleEntity, val geolocalized: Boolean? = false, val driver: DriverEntity?)

        @Transactional
        fun getAtDateIfTracked(vehicleId: String, date: LocalDate): VehicleAndCurrentDriver?{
            try {
                val vehicle = getEntityManager().createQuery(
                    """
                SELECT v,
                       (vup.id.startDate IS NULL
                    AND dup.id.startDate IS NULL) as geolocalized,
                        d
                FROM VehicleEntity v 
                    LEFT JOIN FETCH VehicleDriverEntity vd  
                        ON vd.id.vehicleId = v.id
                        AND vd.id.startDate <= :date 
                        AND (vd.endDate IS NULL OR vd.endDate >= :date) 
                    LEFT JOIN FETCH DriverEntity d ON d.id = vd.id.driverId 
                    LEFT JOIN VehicleUntrackedPeriodEntity vup 
                        ON vup.id.vehicleId = v.id 
                        AND vup.id.startDate <= :date 
                        AND (vup.endDate IS NULL OR vup.endDate >= :date)    
                    LEFT JOIN DriverUntrackedPeriodEntity dup 
                        ON dup.id.driverId = d.id 
                        AND dup.id.startDate <= :date 
                        AND (dup.endDate IS NULL OR dup.endDate >= :date)      
                WHERE v.id = :vehicleId 
                """.trimIndent(), VehicleAndCurrentDriver::class.java)
                    .setParameter("vehicleId", vehicleId).
                    setParameter("date", date.atStartOfDay()).
                    singleResult
                return vehicle
            }catch (ex: NoResultException){
                return null
            }
        }


        //Method to get the driver and the vehicle entity
        @Transactional
        fun getVehicleDriverAtDate(vehicleId: String, date: LocalDate): VehicleAndCurrentDriver?= getEntityManager().createQuery(
            """
                SELECT v, d
                FROM VehicleEntity v 
                    LEFT JOIN FETCH VehicleDriverEntity vd  
                        ON vd.id.vehicleId = v.id
                        AND vd.id.startDate <= :date 
                        AND (vd.endDate IS NULL OR vd.endDate >= :date) 
                    LEFT JOIN FETCH DriverEntity d ON d.id = vd.id.driverId    
                WHERE v.id = :vehicleId 
                """.trimIndent(), VehicleAndCurrentDriver::class.java).setParameter("vehicleId", vehicleId).setParameter("date", date.atStartOfDay()).resultList.firstOrNull()


        @Transactional
        fun getFilteredVehicles(
            teamLabels: List<String>? = null,
            vehicleIds: List<String>? = null,
            driverNames: List<String>? = null,
        ): List<VehicleEntity> {
            var (queryTemp, params) = getFiltersRequest(teamLabels, vehicleIds, driverNames)
            val panacheQuery = VehicleEntity.find(BASE_QUERY+GEOLOCALIZED_CONDITION+queryTemp, params)

            return panacheQuery.list()
        }

        @Transactional
        fun getFilteredNonGeolocVehicles(
            teamLabels: List<String>? = null,
            vehicleIds: List<String>? = null,
            driverNames: List<String>? = null,
        ): List<VehicleEntity> {
            var (queryTemp, params) = getFiltersRequest(teamLabels, vehicleIds, driverNames)
            val panacheQuery = VehicleEntity.find(BASE_QUERY+NON_GEOLOCALIZED_CONDITION+queryTemp, params)

            return panacheQuery.list()
        }



        private fun getFiltersRequest(
            teamLabels: List<String>? = null,
            vehicleIds: List<String>? = null,
            driverNames: List<String>? = null,
        ): Pair<String,  MutableMap<String, Any>> {
            val params = mutableMapOf<String, Any>()
            var query = ""
            println("=== VehicleEntity.getFilteredVehicles(...)")
            var query =
                """
            SELECT v
            FROM VehicleEntity v
            JOIN FETCH VehicleTeamEntity vt ON v.id = vt.id.vehicleId
            JOIN FETCH TeamEntity t ON vt.id.teamId = t.id
            LEFT JOIN t.parentTeam parent_team
            LEFT JOIN FETCH VehicleDriverEntity vd ON v.id = vd.id.vehicleId
                AND vd.id.startDate <= current_date()
                AND (vd.endDate IS NULL OR vd.endDate >= current_date())   
            LEFT JOIN FETCH DriverEntity d ON vd.id.driverId = d.id
            JOIN FETCH DeviceVehicleInstallEntity dvi ON v.id = dvi.id.vehicleId
                AND dvi.id.startDate <= current_date()
                AND (dvi.endDate IS NULL OR dvi.endDate >= current_date())   
            JOIN FETCH DeviceEntity de ON dvi.id.deviceId = de.id
            LEFT JOIN FETCH DeviceDataStateEntity ds ON de.id = ds.device_id 
            LEFT JOIN VehicleUntrackedPeriodEntity vup 
                ON vup.id.vehicleId = v.id 
                AND vup.id.startDate <= current_date()
                AND (vup.endDate IS NULL OR vup.endDate >= current_date())    
            LEFT JOIN DriverUntrackedPeriodEntity dup 
                ON dup.id.driverId = d.id 
                AND dup.id.startDate <= current_date() 
                AND (dup.endDate IS NULL OR dup.endDate >= current_date()) 
            WHERE 1 = 1
            AND vt.endDate IS NULL
            AND vd.endDate IS NULL
            AND vup.id.startDate IS NULL
            AND dup.id.startDate IS NULL
            """

            var (queryTemp, params) = getFiltersRequest(teamLabels, vehicleIds, driverNames)
            val panacheQuery = VehicleEntity.find(BASE_QUERY+GEOLOCALIZED_CONDITION+queryTemp, params)

            return panacheQuery.list()
        }

        @Transactional
        fun getFilteredNonGeolocVehicles(
            teamLabels: List<String>? = null,
            vehicleIds: List<String>? = null,
            driverNames: List<String>? = null,
        ): List<VehicleEntity> {
            var (queryTemp, params) = getFiltersRequest(teamLabels, vehicleIds, driverNames)
            val panacheQuery = VehicleEntity.find(BASE_QUERY+NON_GEOLOCALIZED_CONDITION+queryTemp, params)

            return panacheQuery.list()
        }



        private fun getFiltersRequest(
            teamLabels: List<String>? = null,
            vehicleIds: List<String>? = null,
            driverNames: List<String>? = null,
        ): Pair<String,  Map<String, Any>> {
            val params = mutableMapOf<String, Any>()
            var query = ""
            if (!teamLabels.isNullOrEmpty() && !vehicleIds.isNullOrEmpty() && !driverNames.isNullOrEmpty()) {

                query += "AND (t.label IN :teamLabels OR (parent_team IS NOT NULL AND parent_team.label IN :teamLabels))" +
                        " AND (v.licenseplate IN :vehicleIds OR CONCAT(d.lastName, ' ', d.firstName) IN :driverNames)"

                params["teamLabels"] = teamLabels
                params["vehicleIds"] = vehicleIds
                params["driverNames"] = driverNames
            } else {
                if (!teamLabels.isNullOrEmpty()) {
                    query += "AND (t.label IN :teamLabels OR (parent_team IS NOT NULL AND parent_team.label IN :teamLabels))"
                    params["teamLabels"] = teamLabels
                }
                if (!vehicleIds.isNullOrEmpty()) {
                    query += " AND v.licenseplate IN :vehicleIds"
                    params["vehicleIds"] = vehicleIds
                }
                if (!driverNames.isNullOrEmpty()) {
                    val hasUnassignedSentinel = driverNames.contains("Véhicule non attribué")
                    // On retire la sentinelle pour ne garder que les noms "réel"
                    val realDriverNames = driverNames.filter { it != "Véhicule non attribué" }
                    when {
                        // 1) Cas : à la fois "Véhicule non attribué" ET une liste de noms
                        hasUnassignedSentinel && realDriverNames.isNotEmpty() -> {
                            query += """
                            AND (
                                (d.lastName || ' ' || d.firstName) IN :driverNames
                            OR d IS NULL
                        )
                        """
                            params["driverNames"] = realDriverNames
                        }
                        // 2) Cas : uniquement "Véhicule non attribué" dans driverNames
                        hasUnassignedSentinel -> {
                            query += " AND d IS NULL"
                            // ici, pas de paramètre driverNames à affecter
                        }
                        // 3) Cas : pas de sentinelle, on filtre seulement sur les noms fournis
                        else -> {
                            query += " AND (d.lastName || ' ' || d.firstName) IN :driverNames"
                            params["driverNames"] = realDriverNames
                        }
                    }
                }
            }
            return Pair(query, params)
        }
    }
}
