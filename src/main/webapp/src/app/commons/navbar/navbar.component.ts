import {Component, EventEmitter, Output, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { FilterService } from './filter.service';
import {KeycloakService} from "keycloak-angular";
import {KeycloakProfile} from "keycloak-js";
import {VehicleService} from "../../features/vehicle/vehicle.service";
import {TeamService} from "../../features/vehicle/team.service";
import {DriverService} from "../../features/vehicle/driver.service";
import {Option, TeamTreeComponent} from './team.tree.component';
import {dto} from "../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import VehicleSummaryDTO = dto.VehicleSummaryDTO;


@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="nav-buttons">
        <button class="transparent-blur-bg" (click)="navigateTo('dashboard')">État de parc</button>
        <button class="transparent-blur-bg" (click)="navigateTo('cartography')">Cartographie</button>
      </div>
      <div class="filters">
<!--        <app-team-tree [teamTree]="agencyOptions" (selectedTeamsChange)="updateAgencies($event)"></app-team-tree>-->
        <app-team-tree [label]="'Agences'" [options]="agencyOptions" (selectedTagsChange)="updateAgencies($event)" ></app-team-tree>
<!--        <app-search-autocomplete [label]="'Agences'" [options]="agencyOptions" (selectedTagsChange)="updateAgencies($event)" ></app-search-autocomplete>-->
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
  driverOptions:string[]=[];
  vehicleOptions:VehicleSummaryDTO[]=[];

  // These will hold the filtered options based on selected agencies
  filteredVehicleOptions: string[] = [];
  filteredDriverOptions: string[] = [];

  agencySelected: string[] = [];
  vehicleSelected: string[] = [];
  driverSelected: string[] = [];

  updateAgencies(tags: string[]) {
    this.agencySelected = tags;

    // Reset selected vehicles and drivers
    //this.vehicleSelected = [];
    //this.driverSelected = [];
    this.emitSelectedTags();
    this.filterVehiclesAndDrivers();

    // const previouslySelectedAgencies = [...this.agencySelected];
    //
    // this.agencySelected = tags;
    //
    // // Keep previously selected vehicles and drivers intact when adding new agencies
    // if (this.agencySelected.length > previouslySelectedAgencies.length) {
    //   // Newly selected agency was added
    //   this.emitSelectedTags();
    //   this.filterVehiclesAndDrivers();
    //   return;
    // }
    //
    // // An agency has been removed, delete the vehicles and drivers associated with that agency
    // previouslySelectedAgencies.forEach(agency => {
    //   if (!this.agencySelected.includes(agency)) {
    //     this.removeVehiclesAndDriversForAgency(agency);
    //   }
    // });
    //
    // this.emitSelectedTags();
    // this.filterVehiclesAndDrivers();

  }

  ////////////////////////
  // Example Transformation Logic
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
    //console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',roots);
    return roots;

  }

  ////////////////////////

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
      // this.teamService.getAgencies().subscribe((agencies) => {
      //   this.agencyOptions = agencies;
      });
     // this.teamService.getTeamTree().subscribe(agencies => this.agencyOptions = agencies);
      this.vehicleService.getVehiclesList().subscribe((vehicles) => {
        this.vehicleOptions = vehicles;
        this.filteredVehicleOptions = vehicles.map(vehicle => vehicle.licenseplate);
      });
      this.driverService.getDrivers().subscribe((drivers) => {
        this.driverOptions = drivers;
        this.filteredDriverOptions = drivers;
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
        this.filteredVehicleOptions = filteredVehicles.map(vehicle => vehicle.licenseplate);;
      });

      this.driverService.getDrivers(this.agencySelected).subscribe((filteredDrivers) => {
        this.filteredDriverOptions = filteredDrivers;

      });
    } else {
      // If no agency is selected, reset to the original options
      this.filteredVehicleOptions = this.vehicleOptions.map(vehicle => vehicle.licenseplate);;
      this.filteredDriverOptions = this.driverOptions;

    }

    // this.filteredVehicleOptions = this.getFilteredVehicles(this.agencySelected);
    // this.filteredDriverOptions = this.getFilteredDrivers(this.agencySelected);
  }


  // getFilteredVehicles(selectedAgencies: string[]): string[] {
  //   // Return filtered vehicles based on the selected agencies
  //   return this.vehicleOptions.filter(vehicle => {
  //     // Implement the logic to filter vehicles based on selected agencies
  //     return selectedAgencies.includes(vehicle);  // Example filter, update with actual logic
  //   });
  // }
  //
  // getFilteredDrivers(selectedAgencies: string[]): string[] {
  //   // Return filtered drivers based on the selected agencies
  //   return this.driverOptions.filter(driver => {
  //     // Implement the logic to filter drivers based on selected agencies
  //     return selectedAgencies.includes(driver);  // Example filter, update with actual logic
  //   });
  // }

  // This method will remove vehicles and drivers associated with the deleted agency
  removeVehiclesAndDriversForAgency(agency: string) {
    // Filter out the vehicles and drivers associated with the removed agency
    this.vehicleSelected = this.vehicleSelected.filter(vehicle => !this.isVehicleForAgency(vehicle, agency));
    this.driverSelected = this.driverSelected.filter(driver => !this.isDriverForAgency(driver, agency));

    // Emit the new selected values
    this.emitSelectedTags();
  }

  // Helper methods to check if a vehicle or driver belongs to an agency
  isVehicleForAgency(vehicle: string, agency: string): boolean {
    // Replace this logic with your actual logic to check if the vehicle belongs to the agency
    return vehicle.includes(agency);  // Example condition
  }

  isDriverForAgency(driver: string, agency: string): boolean {
    // Replace this logic with your actual logic to check if the driver belongs to the agency
    return driver.includes(agency);  // Example condition
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);  // Utilise le routeur pour naviguer
  }

  logout() {
  this.keycloakService.logout("https://smartyplan.staging.nm.enovea.net/")
  }
/*  logout() {
    this.keycloakService.logout("http://localhost:8080/")

  }*/
}
