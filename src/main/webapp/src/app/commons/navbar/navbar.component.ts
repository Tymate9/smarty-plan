import {Component, EventEmitter, Output, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { FilterService } from './filter.service';
import {KeycloakService} from "keycloak-angular";
import {KeycloakProfile} from "keycloak-js";
import {VehicleService} from "../../features/vehicle/vehicle.service";
import {TeamService} from "../../features/vehicle/team.service";
import {DriverService} from "../../features/vehicle/driver.service";


@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="nav-buttons">
        <button class="transparent-blur-bg" (click)="navigateTo('dashboard')">État de parc</button>
        <button class="transparent-blur-bg" (click)="navigateTo('cartography')">Cartographie</button>
      </div>
      <div class="filters">
        <app-search-autocomplete [label]="'Agences'" [options]="agencyOptions" (selectedTagsChange)="updateAgencies($event)" ></app-search-autocomplete>
        <app-search-autocomplete [label]="'Véhicules'" [options]="vehicleOptions" (selectedTagsChange)="updateVehicles($event)"></app-search-autocomplete>
        <app-search-autocomplete [label]="'Conducteurs'" [options]="driverOptions" (selectedTagsChange)="updateDrivers($event)"></app-search-autocomplete>
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

  agencyOptions:string[] = [];
  driverOptions:string[]=[];
  vehicleOptions:string[]=[]

  //agencyOptions = ['Service Technique Rouen', 'Service Commercial Rouen', 'Service Technique Caen'];
  //vehicleOptions = ['1', '2', '3'];
  //driverOptions = ['Conducteur 1', 'Conducteur 2', 'Conducteur 3', 'Conducteur 4'];

  agencySelected: string[] = [];
  vehicleSelected: string[] = [];
  driverSelected: string[] = [];

  updateAgencies(tags: string[]) {
    this.agencySelected = tags;
    this.emitSelectedTags();
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

      this.teamService.getAgencies().subscribe((agencies) => {
        this.agencyOptions = agencies;
      });
      this.driverService.getDrivers().subscribe((drivers) => {
        this.driverOptions = drivers;
      });
      this.vehicleService.getVehiclesList().subscribe((vehicles) => {
        this.vehicleOptions = vehicles;
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
