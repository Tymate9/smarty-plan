package net.enovea.workInProgress.affectationCRUD


import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanionBase
import jakarta.enterprise.context.ApplicationScoped
import jakarta.ws.rs.NotFoundException
import net.enovea.driver.driverTeam.DriverTeamEntity
import net.enovea.vehicle.vehicleDriver.VehicleDriverEntity
import net.enovea.vehicle.vehicleTeam.VehicleTeamEntity
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObjectInstance

open class AffectationService(
    private val affectationMapper : AffectationMapper
) {

    fun <E, ID : Any> create( entityClass: KClass<E>, form: AffectationForm): AffectationDTO<*, *>
            where E : IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, ID>
    {
        // 1) Récupérer le type d’affectation (scellé) depuis le form
        val type = form.classInfo
            ?: throw IllegalArgumentException("L'attribut classInfo doit être renseigné dans le formulaire.")

        // 2) Extraction du companion factory
        val factory = extractAffectationFactoryCompanion(entityClass)

        // 3) Construction de l’entité à partir du formulaire
        val entity = factory.createFromForm(form)

        // 4) Persister l’entité via Panache
        (entity as PanacheEntityBase).persist()

        // 5) Construction de l'identifiant textuel à partir de l'entité persistée
        val id = entity.getBuildId()

        // 6) Construction du DTO
        return affectationMapper.toDTO(entity)
        /*AffectationDTO(
            id = id,
            startDate = entity.getStartDate(),
            endDate = entity.endDate,
            subject = entity.getSubject(),
            target = entity.getTarget(),
            affectationType = type
        )*/
    }

    fun <E, ID : Any> getById(entityClass: KClass<E>, id: ID): AffectationDTO<*, *>
            where E : IAffectationPanacheEntity<*, *, ID> {
        // Extraction du companion Panache pour l'entité donnée
        @Suppress("UNCHECKED_CAST")
        val companion = extractPanacheCompanion(entityClass) as PanacheCompanionBase<E, ID>

        // Récupération de l'entité par son identifiant
        val entity = companion.findById(id) ?: throw NotFoundException("Aucune affectation trouvée pour l'id: $id")

        // Détermination du type d'affectation
        val affectationType = when(entity) {
            is VehicleDriverEntity -> AffectationType.DRIVER_VEHICLE
            is DriverTeamEntity -> AffectationType.DRIVER_TEAM
            is VehicleTeamEntity -> AffectationType.VEHICLE_TEAM
            else -> throw IllegalArgumentException("Type d'affectation non supporté pour ${entity::class.simpleName}")
        }

        // Construction et retour du DTO en utilisant les méthodes de l'interface IAffectationEntity
        return affectationMapper.toDTO(entity)
/*        AffectationDTO(
            id = entity.getBuildId(),
            startDate = entity.getStartDate(),
            endDate = entity.endDate,
            subject = entity.getSubject(),
            target = entity.getTarget(),
            affectationType = affectationType
        )*/
    }

    fun <E, ID : Any> update(
        entityClass: KClass<E>,
        id: ID,
        form: AffectationForm
    ): AffectationDTO<*, *>
            where E : IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, ID>
    {
        // 1) Récupérer l'entité existante
        @Suppress("UNCHECKED_CAST")
        val companion = extractPanacheCompanion(entityClass) as PanacheCompanionBase<E, ID>
        val existingEntity = companion.findById(id)
            ?: throw NotFoundException("Aucune affectation trouvée pour l'id: $id")

        // 2) Extraction du companion factory
        val factory = extractAffectationFactoryCompanion<E, ID>(entityClass)

        // 3) Créer une nouvelle entité mise à jour à partir du formulaire
        val updatedEntity = factory.createFromForm(form)

        // 4) Conserver l'identifiant
        updatedEntity.id = id

        // 5) Persister l'entité mise à jour
        (updatedEntity as PanacheEntityBase).persist()

        // 6) Détermination du type d'affectation (depuis le form ou via un when)
/*        val affectationType = form.classInfo ?: when (updatedEntity) {
            is VehicleDriverEntity -> AffectationType.DRIVER_VEHICLE
            is DriverTeamEntity    -> AffectationType.DRIVER_TEAM
            is VehicleTeamEntity   -> AffectationType.VEHICLE_TEAM
            else -> throw IllegalArgumentException("Type d'affectation non supporté pour ${updatedEntity::class.simpleName}")
        }*/

        // 7) Construction du DTO
        return affectationMapper.toDTO(updatedEntity)
        /*AffectationDTO(
            id = updatedEntity.getBuildId(),
            startDate = updatedEntity.getStartDate(),
            endDate = updatedEntity.endDate,
            subject = updatedEntity.getSubject(),
            target = updatedEntity.getTarget(),
            affectationType = affectationType
        )*/
    }

    // Fonction delete générique
    fun <E, ID : Any> delete(
        entityClass: KClass<E>,
        id: ID
    ): AffectationDTO<*, *>
            where E : IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, ID>
    {
        // 1) Extraction du companion
        @Suppress("UNCHECKED_CAST")
        val companion = extractPanacheCompanion(entityClass) as PanacheCompanionBase<E, ID>
        // 2) Récupération de l'entité
        val entity = companion.findById(id)
            ?: throw NotFoundException("Aucune affectation trouvée pour l'id: $id")

        // 3) Suppression de l'entité
        entity.delete()

        // 4) Détermination du type d'affectation
        val affectationType = when (entity) {
            is VehicleDriverEntity -> AffectationType.DRIVER_VEHICLE
            is DriverTeamEntity    -> AffectationType.DRIVER_TEAM
            is VehicleTeamEntity   -> AffectationType.VEHICLE_TEAM
            else -> throw IllegalArgumentException("Type d'affectation non supporté pour ${entity::class.simpleName}")
        }

        // 5) Construction et retour du DTO
        return affectationMapper.toDTO(entity)

/*        AffectationDTO(
            id = entity.getBuildId(),
            startDate = entity.getStartDate(),
            endDate = entity.endDate,
            subject = entity.getSubject(),
            target = entity.getTarget(),
            affectationType = affectationType
        )*/
    }

    // ==================================================================
    // Fonction utilitaire pour extraire le companion
    // ==================================================================
    private fun <T> extractPanacheCompanion (entityClass: KClass<T>): PanacheCompanionBase<T, *> where T : PanacheEntityBase {
        val companionObj = entityClass.companionObjectInstance
            ?: throw IllegalArgumentException("Le companion n'a pas été trouvé pour ${entityClass.simpleName}")

        @Suppress("UNCHECKED_CAST")
        val repo = companionObj as? PanacheCompanionBase<T, *> ?:
        throw IllegalArgumentException("Le companion de ${entityClass.simpleName} n'implémente pas PanacheCompanionBase.")
        return repo
    }

    private fun <E, ID : Any> extractAffectationFactoryCompanion(
        entityClass: KClass<E>
    ): IAffectationFactory<E, ID>
            where E : IAffectationPanacheEntity<PanacheEntityBase, PanacheEntityBase, ID>
    {
        val companionObj = entityClass.companionObjectInstance
            ?: throw IllegalArgumentException("Le companion n'a pas été trouvé pour ${entityClass.simpleName}")

        @Suppress("UNCHECKED_CAST")
        return companionObj as? IAffectationFactory<E, ID>
            ?: throw IllegalArgumentException(
                "Le companion de ${entityClass.simpleName} n'implémente pas IAffectationFactory."
            )
    }
}
