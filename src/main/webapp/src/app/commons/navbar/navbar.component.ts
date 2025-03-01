import {Component, OnInit, OnDestroy, inject} from '@angular/core';
import { Router } from '@angular/router';
import { FilterService } from './filter.service';
import Keycloak from 'keycloak-js';
import {VehicleService} from "../../features/vehicle/vehicle.service";
import {TeamService} from "../../features/vehicle/team.service";
import {DriverService} from "../../features/vehicle/driver.service";
import {Option, TeamTreeComponent} from '../searchAutocomplete/team.tree.component';
import {dto} from "../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import VehicleSummaryDTO = dto.VehicleSummaryDTO;
import DriverDTO = dto.DriverDTO;
import {ConfigService} from "../../core/config/config.service";
import {forkJoin, Subscription} from "rxjs";
import {NotificationService} from "../notification/notification.service";
import {Button, ButtonDirective} from "primeng/button";
import {Menubar} from "primeng/menubar";
import {PrimeTemplate} from "primeng/api";
import {SearchAutocompleteComponent} from "../searchAutocomplete/search-autocomplete.component";
import {AppConfig} from "../../app.config";

@Component({
  selector: 'app-navbar',
  template: `
    <p-menubar [style]="{'border': 'none', 'width': '100%', 'z-index':1000, 'position': 'relative'}"
               class="p-menubar transparent-blur-bg full-width ">
      <ng-template pTemplate="start">
        <div class="nav-container">
          <div class="nav-buttons">
            <div class="nav-buttons-row">
              <p-button (onClick)="navigateTo('dashboard')" icon="pi pi-th-large" styleClass="custom-button-bg" title="Tableau de bord"></p-button>
              <p-button (onClick)="navigateTo('cartography')" icon="pi pi-map" styleClass="custom-button-bg" title="Cartographie"></p-button>
              <p-button (onClick)="navigateTo('poiedit')" icon="pi pi-map-marker" styleClass="custom-button-bg" title="POIs"></p-button>
              <p-button (onClick)="navigateTo('report')" icon="pi pi-chart-bar" styleClass="custom-button-bg" title="Suivi d'activité"></p-button>
              <p-button (onClick)="navigateTo('qse-report')" icon="pi pi-chart-line" styleClass="custom-button-bg" title="Rapport QSE"></p-button>
            </div>
          </div>
          <div class="filters center">
            <app-team-tree [label]="'Agences'" [options]="agencyOptions" (selectedTagsChange)="updateAgencies($event)"
                           [selectedItems]="agencySelected"></app-team-tree>
            <app-search-autocomplete [label]="'Véhicules'" [options]="filteredVehicleOptions"
                                     (selectedTagsChange)="updateVehicles($event)"
                                     [selectedItems]="vehicleSelected"></app-search-autocomplete>
            <app-search-autocomplete [label]="'Conducteurs'" [options]="filteredDriverOptions"
                                     (selectedTagsChange)="updateDrivers($event)"
                                     [selectedItems]="driverSelected"></app-search-autocomplete>
            <p-button type="button" icon="pi pi-refresh" label="Reset" (click)="resetFilters()"></p-button>
            <p-button (onClick)="saveFilters()" icon="pi pi-save" styleClass="custom-button-bg"></p-button>
          </div>
        </div>
      </ng-template>
      <ng-template pTemplate="end">
        <div class="user-info compact">
          <p-button icon="pi pi-cog" class="user-settings" styleClass="custom-button-bg"></p-button>
          <p-button (onClick)="logout()" icon="pi pi-power-off" styleClass="custom-button-bg"
                    [disabled]="!logoutURL"></p-button>
        </div>
      </ng-template>
    </p-menubar>
  `,
  styles: [`
    /* Conteneur global du menu */
    .nav-container {
      display: flex;
      align-items: center;
      width: 100%;
      justify-content: space-between;
    }

    .nav-buttons {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-right: auto;
    }

    .nav-buttons-row {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
    }

    /* Applique un margin-right et retire fond/bordures sur les p-button internes */
    .nav-buttons p-button {
      margin-right: 10px;
      background: transparent;
      border: none;
    }

    .filters {
      display: flex;
      align-items: center;
      gap: 15px;
      margin: 0 auto;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }

    .user-info {
      display: flex;
      align-items: center;
      margin-left: auto;
    }

    /* Utilisée dans <div class="user-info compact"> */
    .user-info.compact {
      gap: 5px;
    }

    .user-settings {
      margin-right: 10px;
      background: transparent;
      border: none;
    }

  `],
  imports: [
    Button,
    Menubar,
    PrimeTemplate,
    TeamTreeComponent,
    SearchAutocompleteComponent,
  ],
  standalone: true
})
export class NavbarComponent implements OnInit, OnDestroy {
  constructor(
    private filterService: FilterService,
    private router: Router,
    private vehicleService: VehicleService,
    private teamService: TeamService,
    private driverService: DriverService,
    private configService: ConfigService,
    private notificationService : NotificationService
  ) {}

  // Injection directe de l'instance Keycloak via l'injection token
  private keycloak: Keycloak = inject(Keycloak);
  userProfile: any = null;

  userName: string = '';
  userRole: string = '';

  agencyOptions: Option[] = [];
  agencyTree: Option[] = [];
  driverOptions: DriverDTO[] = [];
  vehicleOptions: VehicleSummaryDTO[] = [];

  // Options filtrées en fonction des agences sélectionnées
  filteredVehicleOptions: string[] = [];
  filteredDriverOptions: string[] = [];

  agencySelected: string[] = [];
  vehicleSelected: string[] = [];
  driverSelected: string[] = [];

  logoutURL: string = ''; // Propriété pour stocker la logoutURL
  private configSubscription: Subscription; // Abonnement pour la configuration

  updateAgencies(tags: string[]) {
    const previouslySelectedAgencies = [...this.agencySelected];
    this.agencySelected = tags;



    // Gérer uniquement les suppressions d'agences
    if (this.agencySelected.length < previouslySelectedAgencies.length) {
      const removedAgencies = previouslySelectedAgencies.filter(
        agency => !this.agencySelected.includes(agency)
      );

      removedAgencies.forEach(agency => {
        this.removeVehiclesAndDriversForAgency(agency);
      });
    }

    this.emitSelectedTags();
    this.filterVehiclesAndDrivers();
  }

  transformToHierarchy(teams: TeamDTO[]): any[] {
    const teamMap = new Map<number, any>();
    const roots: any[] = [];

    const sortByLabel = (a: any, b: any) => a.label.localeCompare(b.label);
    // Mapper toutes les équipes par ID
    teams.forEach(team => {
      if (team.id != null) {
        teamMap.set(team.id, {...team, children: []});
      }
    });

    // Lier les enfants à leurs parents
    teams.forEach(team => {
      if (team.parentTeam?.id) {
        const parent = teamMap.get(team.parentTeam.id);
        if (parent) {
          if (team.id != null) {
            parent.children.push(teamMap.get(team.id));
          }
        }
      } else {
        // Équipe de niveau racine
        if (team.id != null) {
          roots.push(teamMap.get(team.id));
        }
      }
    });

    teamMap.forEach(team => {
      team.children.sort(sortByLabel);
    });

    roots.sort(sortByLabel);
    return roots;

  }

  updateVehicles(tags: string[]) {
    this.vehicleSelected = tags;
    this.emitSelectedTags();
  }

  updateDrivers(tags: string[]) {
    this.driverSelected = tags;
    this.emitSelectedTags();
  }

  emitSelectedTags() {
    const newFilters = {
      agencies: this.agencySelected,
      vehicles: this.vehicleSelected,
      drivers: this.driverSelected
    };

    if (!this.areFiltersEqual(this.filterService.getCurrentFilters(), newFilters)) {
      this.filterService.updateFilters(newFilters);
    }
  }

  private areFiltersEqual(filters1: { [key: string]: string[] }, filters2: { [key: string]: string[] }): boolean {
    return JSON.stringify(filters1) === JSON.stringify(filters2);
  }

  async ngOnInit() {
    try {
      // Vérification de l'instance Keycloak injectée
      console.log('Keycloak instance:', this.keycloak);

      if (this.keycloak && this.keycloak.authenticated) {
        // Extraction du profil depuis le token décodé
        this.userProfile = this.keycloak.tokenParsed;
        console.log('Token Parsed:', this.keycloak.tokenParsed);
        this.userName = `${this.userProfile.firstName || ''} ${this.userProfile.lastName || ''}`.trim();
      } else {
        console.warn('Keycloak non authentifié ou instance non disponible');
      }

      // Extraction des rôles depuis le token (en vérifiant resourceAccess et realm_access)
      let roles: string[] = [];
      if (this.keycloak && this.keycloak.tokenParsed) {
        const tokenParsed = this.keycloak.tokenParsed;
        console.log('Token Parsed for roles:', tokenParsed);
        if (tokenParsed["resourceAccess"]) {
          console.log('resourceAccess:', tokenParsed["resourceAccess"]);
          const clientId = AppConfig.config.keycloakConfig.frontendClientId;
          if (tokenParsed["resourceAccess"][clientId]) {
            roles = tokenParsed["resourceAccess"][clientId].roles;
          }
        } else if (tokenParsed["realm_access"]) {
          console.log('realm_access:', tokenParsed["realm_access"]);
          roles = tokenParsed["realm_access"].roles;
        } else {
          console.warn('Aucune propriété resourceAccess ou realm_access dans le token');
        }
      } else {
        console.warn('tokenParsed non disponible');
      }
      console.log('Rôles extraits:', roles);
      this.userRole = roles && roles.length > 0 ? roles.join(' / ') : 'Aucun rôle trouvé';

      // Chargement parallèle des données (agences, véhicules, conducteurs)
      forkJoin({
        agencies: this.teamService.getAgencies(),
        vehicles: this.vehicleService.getVehiclesList(),
        drivers: this.driverService.getDrivers()
      }).subscribe(({ agencies, vehicles, drivers }) => {
        console.log('Agencies:', agencies);
        console.log('Vehicles:', vehicles);
        console.log('Drivers:', drivers);

        // Traitement des agences
        this.agencyOptions = this.transformToHierarchy(agencies);
        this.agencyTree = this.agencyOptions;

        // Traitement des véhicules
        this.vehicleOptions = vehicles;
        this.filteredVehicleOptions = vehicles
          .sort((a, b) => (a.licenseplate || '').localeCompare(b.licenseplate || ''))
          .map(vehicle => vehicle.licenseplate || '');

        // Traitement des conducteurs
        this.driverOptions = drivers;
        this.filteredDriverOptions = drivers
          .sort((a, b) => {
            const cmp = (a.lastName || '').localeCompare(b.lastName || '');
            return cmp !== 0 ? cmp : (a.firstName || '').localeCompare(b.firstName || '');
          })
          .map(driver => `${driver.lastName || ''} ${driver.firstName || ''}`.trim())
          .concat('Véhicule non attribué');

        // Chargement des filtres initiaux depuis le FilterService
        this.loadInitialFilters();
      });

      // Abonnement à la configuration pour récupérer l'URL de déconnexion
      this.configSubscription = this.configService.getConfig().subscribe(config => {
        console.log('Configuration Keycloak:', config);
        if (config) {
          this.logoutURL = config.keycloakConfig.redirectUrl;
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Navbar', error);
    }
  }

  // Méthode de déconnexion utilisant directement l'instance Keycloak injectée
  logout() {
    if (this.keycloak) {
      this.keycloak.logout({ redirectUri: this.logoutURL });
    } else {
      console.error('Instance Keycloak non disponible pour la déconnexion.');
      alert('Impossible de déconnecter. Veuillez réessayer plus tard.');
    }
  }

  // Filtrer les véhicules et conducteurs basés sur les agences sélectionnées
  filterVehiclesAndDrivers() {
    if (this.agencySelected.length > 0) {

      this.vehicleService.getVehiclesList(this.agencySelected).subscribe((filteredVehicles) => {
        this.filteredVehicleOptions = filteredVehicles
          .sort((a, b) => (a.licenseplate || '').localeCompare(b.licenseplate || ''))
          .map(vehicle => vehicle.licenseplate || '');
      });

      this.driverService.getDrivers(this.agencySelected).subscribe((filteredDrivers) => {
        this.filteredDriverOptions = filteredDrivers
          .sort((a, b) => {
            const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '');
            if (lastNameComparison !== 0) {
              return lastNameComparison;
            }
            return (a.firstName || '').localeCompare(b.firstName || '');
          })
          .map(driver => `${driver.lastName || ''} ${driver.firstName || ''}`.trim())
          .concat('Véhicule non attribué');
      });
    } else {
      // Si aucune agence n'est sélectionnée, réinitialiser aux options originales
      this.filteredVehicleOptions = this.vehicleOptions.map(vehicle => vehicle.licenseplate);
      this.filteredDriverOptions = this.driverOptions.map(driver => `${driver.lastName || ''} ${driver.firstName || ''}`.trim())
        .concat('Véhicule non attribué');
    }


  }

  removeVehiclesAndDriversForAgency(deletedAgencyId: string): void {
    // Obtenir tous les IDs d'agences à supprimer (y compris les enfants)
    let agenciesToRemove = this.getAllAgencyIdsToRemove(deletedAgencyId);
    const vehiclesToRemove = this.vehicleOptions
      .filter(vehicle => agenciesToRemove.includes(vehicle.team.label))
      .map(vehicle => vehicle.licenseplate);

    this.vehicleSelected = this.vehicleSelected.filter(
      vehicleId => !vehiclesToRemove.includes(vehicleId)
    );

    const driversToRemove = this.driverOptions
      .filter(driver => agenciesToRemove.includes(driver.team.label))
      .map(driver => `${driver.lastName} ${driver.firstName}`);

    this.driverSelected = this.driverSelected
      .filter(driverName => !driversToRemove.includes(driverName));
  }

  getAllAgencyIdsToRemove(agencyId: string): string[] {
    // Fonction récursive pour trouver une agence dans l'arbre
    const findAgencyInTree = (tree: any[], agencyId: string): any | null => {
      for (const agency of tree) {
        if (agency.label === agencyId) {
          return agency; // Agence trouvée
        }
        if (agency.children) {
          const found = findAgencyInTree(agency.children, agencyId);
          if (found) return found; // Trouvée dans une branche enfant
        }
      }
      return null; // Non trouvée
    };
    const agency = findAgencyInTree(this.agencyTree, agencyId);
    if (!agency) return [];

    // Commencer avec l'ID de l'agence actuelle
    let idsToRemove = [agencyId];

    // Récursivement collecter les IDs des agences enfants
    if (agency.children) {
      for (const child of agency.children) {
        idsToRemove = idsToRemove.concat(this.getAllAgencyIdsToRemove(child.label));
      }
    }

    return idsToRemove;
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);  // Utilise le routeur pour naviguer
  }

  saveFilters(): void {
    this.filterService.saveFiltersToLocalStorage();

    // Afficher une notification
    this.notificationService.success('Filtres sauvegardés', 'Vos filtres ont été sauvegardés avec succès.');
  }

  private loadInitialFilters(): void {
    // Récupérer les filtres initiaux depuis le FilterService
    const currentFilters = this.filterService.getCurrentFilters() as { agencies: string[], vehicles: string[], drivers: string[] };

    // Mettre à jour les sélections locales avec les filtres chargés
    this.agencySelected = currentFilters.agencies || [];
    this.vehicleSelected = currentFilters.vehicles || [];
    this.driverSelected = currentFilters.drivers || [];

    // Filtrer les véhicules et les conducteurs en fonction des agences sélectionnées
    this.filterVehiclesAndDrivers();

    // Mettre à jour les options filtrées pour les véhicules et les conducteurs
    // en fonction des sélections chargées
    this.updateFilteredOptionsAfterLoading();
  }

  private updateFilteredOptionsAfterLoading(): void {
    // Si des agences sont sélectionnées, filtrer les véhicules et conducteurs
    if (this.agencySelected.length > 0) {
      // Filtrer les véhicules
      this.vehicleService.getVehiclesList(this.agencySelected).subscribe((filteredVehicles) => {
        this.filteredVehicleOptions = filteredVehicles
          .sort((a, b) => (a.licenseplate || '').localeCompare(b.licenseplate || ''))
          .map(vehicle => vehicle.licenseplate || '');

        // Mettre à jour les sélections de véhicules pour ne conserver que ceux qui sont toujours valides
        this.vehicleSelected = this.vehicleSelected.filter(licensePlate => this.filteredVehicleOptions.includes(licensePlate));
      });

      // Filtrer les conducteurs
      this.driverService.getDrivers(this.agencySelected).subscribe((filteredDrivers) => {
        this.filteredDriverOptions = filteredDrivers
          .sort((a, b) => {
            const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '');
            if (lastNameComparison !== 0) {
              return lastNameComparison;
            }
            return (a.firstName || '').localeCompare(b.firstName || '');
          })
          .map(driver => `${driver.lastName || ''} ${driver.firstName || ''}`.trim())
          .concat('Véhicule non attribué');

        // Mettre à jour les sélections de conducteurs pour ne conserver que ceux qui sont toujours valides
        this.driverSelected = this.driverSelected.filter(driverName => this.filteredDriverOptions.includes(driverName))
          .concat('Véhicule non attribué');
      });
    } else {
      // Si aucune agence n'est sélectionnée, réinitialiser les options
      this.filteredVehicleOptions = this.vehicleOptions.map(vehicle => vehicle.licenseplate);
      this.filteredDriverOptions = this.driverOptions.map(driver => `${driver.lastName || ''} ${driver.firstName || ''}`.trim())
        .concat('Véhicule non attribué');
    }
  }

  resetFilters(): void {
    this.agencySelected = [];
    this.vehicleSelected = [];
    this.driverSelected = [];

    this.filterService.resetFilters();
    this.filterService.triggerReset();

    this.filterVehiclesAndDrivers();
    this.updateFilteredOptionsAfterLoading();
    this.emitSelectedTags();
  }

  ngOnDestroy() {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
  }
}

