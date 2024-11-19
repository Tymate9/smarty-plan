import {Component, EventEmitter, Output, OnInit} from '@angular/core';
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


@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="nav-buttons">
        <button class="transparent-blur-bg" (click)="navigateTo('dashboard')">État de parc</button>
        <button class="transparent-blur-bg" (click)="navigateTo('cartography')">Cartographie</button>
      </div>
      <div class="filters">

        <app-team-tree [label]="'Agences'" [options]="agencyOptions" (selectedTagsChange)="updateAgencies($event)" ></app-team-tree>
        <app-search-autocomplete [label]="'Véhicules'" [options]="filteredVehicleOptions" (selectedTagsChange)="updateVehicles($event)" [selectedItems]="vehicleSelected"></app-search-autocomplete>
        <app-search-autocomplete [label]="'Conducteurs'" [options]="filteredDriverOptions" (selectedTagsChange)="updateDrivers($event)"  [selectedItems]="driverSelected"></app-search-autocomplete>
      </div>
      <div class="user-info">
        <span>{{ userName }}</span>
        <span>{{ userRole }}</span>
        <button class="transparent-blur-bg"  (click)="logout()">Déconnexion</button>
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
export class NavbarComponent implements OnInit {
  constructor(private filterService: FilterService,
              private keycloakService: KeycloakService,
              private router: Router,
              private  vehicleService:VehicleService,
              private teamService: TeamService,
              private driverService: DriverService) {}

  userName: string = '';
  userRole: string = '';
  userProfile: KeycloakProfile | null = null;

  agencyOptions:Option[] = [];
  agencyTree:Option[]=[];
  driverOptions:DriverDTO[]=[];
  vehicleOptions:VehicleSummaryDTO[]=[];

  // These will hold the filtered options based on selected agencies
  filteredVehicleOptions: string[] = [];
  filteredDriverOptions: string[] = [];

  agencySelected: string[] = [];
  vehicleSelected: string[] = [];
  driverSelected: string[] = [];


  updateAgencies(tags: string[]) {
    const previouslySelectedAgencies = [...this.agencySelected];
    this.agencySelected = tags;

    // Handle only agency removals
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

    // Map all teams by ID
    teams.forEach(team => {
      teamMap.set(team.id, { ...team, children: [] });
    });

    // Link children to their parents
    teams.forEach(team => {
      if (team.parentTeam?.id) {
        const parent = teamMap.get(team.parentTeam.id);
        if (parent) {
          parent.children.push(teamMap.get(team.id));
        }
      } else {
        // Root level team
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
      this.userProfile = await this.keycloakService.loadUserProfile();
      this.userName = `${this.userProfile.firstName} ${this.userProfile.lastName}`;

      this.teamService.getAgencies().subscribe(teams => {
        this.agencyOptions = this.transformToHierarchy(teams);
        this.agencyTree=this.agencyOptions;
      });
      this.vehicleService.getVehiclesList().subscribe((vehicles) => {
        this.vehicleOptions = vehicles;
        this.filteredVehicleOptions = vehicles.map(vehicle => vehicle.licenseplate);
      });
      this.driverService.getDrivers().subscribe((drivers) => {
        this.driverOptions = drivers;
        this.filteredDriverOptions = drivers.map(driver=>  `${driver.lastName || ''} ${driver.firstName || ''}`.trim());
      });


      // Si les rôles sont dans le token, les récupérer
      const roles = this.keycloakService.getUserRoles();
      if (roles && roles.length > 0) {
        this.userRole = roles.join(' / ');
      }

    } catch (error) {
      console.error('Failed to load user profile', error);
    }
  }

  //filter vehicles and drivers based on selected agencies
  filterVehiclesAndDrivers() {
    if (this.agencySelected.length > 0) {

      this.vehicleService.getVehiclesList(this.agencySelected).subscribe((filteredVehicles) => {
        this.filteredVehicleOptions = filteredVehicles.map(vehicle => vehicle.licenseplate);
      });

      this.driverService.getDrivers(this.agencySelected).subscribe((filteredDrivers) => {
        this.filteredDriverOptions = filteredDrivers.map(driver=>  `${driver.lastName || ''} ${driver.firstName || ''}`.trim());

      });
    } else {
      // If no agency is selected, reset to the original options
      this.filteredVehicleOptions = this.vehicleOptions.map(vehicle => vehicle.licenseplate);
      this.filteredDriverOptions = this.driverOptions.map(driver=>  `${driver.lastName || ''} ${driver.firstName || ''}`.trim());

    }


  }

  removeVehiclesAndDriversForAgency(deletedAgencyId: string): void {
    // Get all agency IDs to remove (including children)
    let agenciesToRemove = this.getAllAgencyIdsToRemove(deletedAgencyId);

    console.log('agenciesToRemove', agenciesToRemove)

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
    // Recursive function to find an agency anywhere in the tree
    const findAgencyInTree = (tree: any[], agencyId: string): any | null => {
      for (const agency of tree) {
        if (agency.label === agencyId) {
          return agency; // Found the agency
        }
        if (agency.children) {
          const found = findAgencyInTree(agency.children, agencyId);
          if (found) return found; // Found in a child branch
        }
      }
      return null; // Not found
    };
    const agency = findAgencyInTree(this.agencyTree, agencyId);
    if (!agency) return [];

    // Start with the current agency's ID
    let idsToRemove = [agencyId];

    // Recursively collect IDs of all child agencies
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

  // logout() {
  // this.keycloakService.logout("https://smartyplan.staging.nm.enovea.net/")
  // }
  logout() {
    this.keycloakService.logout("http://localhost:8080/")

  }
}
