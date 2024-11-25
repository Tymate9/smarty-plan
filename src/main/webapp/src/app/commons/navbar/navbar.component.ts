import {Component, EventEmitter, Output, OnInit, OnDestroy} from '@angular/core';
import { Router } from '@angular/router';
import { FilterService } from './filter.service';
import {KeycloakService} from "keycloak-angular";
import {KeycloakProfile} from "keycloak-js";
import {VehicleService} from "../../features/vehicle/vehicle.service";
import {TeamService} from "../../features/vehicle/team.service";
import {DriverService} from "../../features/vehicle/driver.service";
import {Option, TeamTreeComponent} from '../searchAutocomplete/team.tree.component';
import {dto} from "../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import VehicleSummaryDTO = dto.VehicleSummaryDTO;
import DriverDTO = dto.DriverDTO;
import {ConfigService} from "../../core/config/config.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="nav-buttons">
        <button class="transparent-blur-bg" (click)="navigateTo('dashboard')">État de parc</button>
        <button class="transparent-blur-bg" (click)="navigateTo('cartography')">Cartographie</button>
        <button class="transparent-blur-bg" (click)="navigateTo('poiedit')">Créer un POI</button>
      </div>

      <div class="filters">
        <app-team-tree [label]="'Agences'" [options]="agencyOptions" (selectedTagsChange)="updateAgencies($event)"></app-team-tree>
        <app-search-autocomplete [label]="'Véhicules'" [options]="filteredVehicleOptions" (selectedTagsChange)="updateVehicles($event)" [selectedItems]="vehicleSelected"></app-search-autocomplete>
        <app-search-autocomplete [label]="'Conducteurs'" [options]="filteredDriverOptions" (selectedTagsChange)="updateDrivers($event)" [selectedItems]="driverSelected"></app-search-autocomplete>
      </div>

      <div class="user-info">
        <span>{{ userName }}</span>
        <span>{{ userRole }}</span>
        <button class="transparent-blur-bg" (click)="logout()" [disabled]="!logoutURL">Déconnexion</button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      justify-content: space-between;
      padding: 10px;
    }
    .nav-buttons button {
      margin-right: 10px;
    }
    .filters {
      flex-grow: 1;
      display: flex;
      justify-content: space-evenly;
      align-items: center;
    }
    .user-info {
      display: flex;
      align-items: center;
    }
    .user-info span {
      margin-right: 10px;
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  constructor(
    private filterService: FilterService,
    private keycloakService: KeycloakService,
    private router: Router,
    private vehicleService: VehicleService,
    private teamService: TeamService,
    private driverService: DriverService,
    private configService: ConfigService // Injection de ConfigService
  ) {}

  userName: string = '';
  userRole: string = '';
  userProfile: KeycloakProfile | null = null;

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

    // Mapper toutes les équipes par ID
    teams.forEach(team => {
      teamMap.set(team.id, { ...team, children: [] });
    });

    // Lier les enfants à leurs parents
    teams.forEach(team => {
      if (team.parentTeam?.id) {
        const parent = teamMap.get(team.parentTeam.id);
        if (parent) {
          parent.children.push(teamMap.get(team.id));
        }
      } else {
        // Équipe de niveau racine
        roots.push(teamMap.get(team.id));
      }
    });
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
    // Appeler le service pour mettre à jour les filtres partagés
    this.filterService.updateFilters({
      agencies: this.agencySelected,
      vehicles: this.vehicleSelected,
      drivers: this.driverSelected
    });

  }

  async ngOnInit() {
    try {
      // Charger le profil utilisateur depuis Keycloak
      this.userProfile = await this.keycloakService.loadUserProfile();
      this.userName = `${this.userProfile.firstName} ${this.userProfile.lastName}`;

      // Récupérer les agences
      this.teamService.getAgencies().subscribe(teams => {
        this.agencyOptions = this.transformToHierarchy(teams);
        this.agencyTree = this.agencyOptions;
      });

      // Récupérer les véhicules
      this.vehicleService.getVehiclesList().subscribe((vehicles) => {
        this.vehicleOptions = vehicles;
        this.filteredVehicleOptions = vehicles.map(vehicle => vehicle.licenseplate);
      });

      // Récupérer les conducteurs
      this.driverService.getDrivers().subscribe((drivers) => {
        this.driverOptions = drivers;
        this.filteredDriverOptions = drivers.map(driver => `${driver.lastName || ''} ${driver.firstName || ''}`.trim());
      });

      // Récupérer les rôles de l'utilisateur depuis Keycloak
      const roles = this.keycloakService.getUserRoles();
      if (roles && roles.length > 0) {
        this.userRole = roles.join(' / ');
      }

      // Abonner à la configuration Keycloak pour obtenir la logoutURL
      this.configSubscription = this.configService.getKeycloakConfig().subscribe(config => {
        if (config) {
          this.logoutURL = config.logoutURL;
          console.log('Logout URL:', this.logoutURL); // Log pour vérification
        }
      });

    } catch (error) {
      console.error('Failed to load user profile', error);
    }
  }

  // Filtrer les véhicules et conducteurs basés sur les agences sélectionnées
  filterVehiclesAndDrivers() {
    if (this.agencySelected.length > 0) {

      this.vehicleService.getVehiclesList(this.agencySelected).subscribe((filteredVehicles) => {
        this.filteredVehicleOptions = filteredVehicles.map(vehicle => vehicle.licenseplate);
      });

      this.driverService.getDrivers(this.agencySelected).subscribe((filteredDrivers) => {
        this.filteredDriverOptions = filteredDrivers.map(driver => `${driver.lastName || ''} ${driver.firstName || ''}`.trim());
      });
    } else {
      // Si aucune agence n'est sélectionnée, réinitialiser aux options originales
      this.filteredVehicleOptions = this.vehicleOptions.map(vehicle => vehicle.licenseplate);
      this.filteredDriverOptions = this.driverOptions.map(driver => `${driver.lastName || ''} ${driver.firstName || ''}`.trim());
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

  logout() {
    if (this.logoutURL) {
      console.log(this.logoutURL)
      this.keycloakService.logout(this.logoutURL);
    } else {
      console.error('Logout URL not available.');
      alert('Impossible de déconnecter. Veuillez réessayer plus tard.');
    }
  }

  ngOnDestroy() {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
  }
}

