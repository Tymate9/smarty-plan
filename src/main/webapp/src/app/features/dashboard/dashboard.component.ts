import { Component, OnInit } from '@angular/core';
import { FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNode, VehicleService} from "../vehicle/vehicle.service";
import {dto} from "../../../habarta/dto";
import VehicleSummaryDTO = dto.VehicleSummaryDTO;
import {TreeNode} from "primeng/api";
import {PoiService} from "../poi/poi.service";
import {GeocodingService} from "../../commons/geo/geo-coding.service";
import TeamEntity = dto.TeamEntity;

@Component({
  selector: 'app-dashboard',
  template: `
    <h1>Dashboard</h1>
    <div>
      <p><strong>Agences sélectionnées :</strong> {{ selectedTags['agencies'].join(', ') || 'Aucune' }}</p>
      <p><strong>Véhicules sélectionnés :</strong> {{ selectedTags['vehicles'].join(', ') || 'Aucune' }}</p>
      <p><strong>Conducteurs sélectionnés :</strong> {{ selectedTags['drivers'].join(', ') || 'Aucune' }}</p>
    </div>


<!--    <p-treeTable *ngIf="vehiclesTree.length"-->
<!--                 [value]="vehiclesTree" [scrollable]="true"-->
<!--                 [tableStyle]="{'min-width':'50rem'}"-->
<!--                 styleClass="p-treetable-gridlines">-->
<!--      <ng-template pTemplate="header">-->
<!--&lt;!&ndash;        <tr>&ndash;&gt;-->
<!--&lt;!&ndash;          <th>Équipe</th>&ndash;&gt;-->
<!--&lt;!&ndash;          <th>Immatriculation</th>&ndash;&gt;-->
<!--&lt;!&ndash;          <th>Driver</th>&ndash;&gt;-->
<!--&lt;!&ndash;          <th>Category</th>&ndash;&gt;-->
<!--&lt;!&ndash;          <th>Statut Géolocalisation</th>&ndash;&gt;-->
<!--&lt;!&ndash;        </tr>&ndash;&gt;-->
<!--      </ng-template>-->
<!--      <ng-template pTemplate="body" let-rowNode let-rowData="rowData">-->
<!--        <tr [ttRow]="rowNode">-->
<!--          <td *ngIf="!rowNode.parent" colspan="6">{{ rowData.team }}-->
<!--            <p-treeTableToggler [rowNode]="rowNode" />-->
<!--            {{ rowData.team.label }}-->
<!--          </td>-->
<!--          <td *ngIf="rowNode.parent">{{ rowData.vehicle.licenseplate }}</td>-->
<!--          <td *ngIf="rowNode.parent">-->
<!--            {{ (rowData.vehicle.driver.lastName || 'Non spécifié') + ' ' + (rowData.vehicle.driver.firstName || 'Non spécifié') }}-->
<!--          </td>-->
<!--          <td *ngIf="rowNode.parent">{{ rowData.vehicle.device.deviceDataState.lastCommTime }}</td>-->
<!--          <td *ngIf="rowNode.parent">{{ rowData.vehicle.device.deviceDataState.state }}</td>-->
<!--          <td *ngIf="rowNode.parent">{{ rowData.vehicle.lastPositionAddress ?? 'Inconnu'}}</td>-->
<!--          <td *ngIf="rowNode.parent">{{ rowData.vehicle.teamHierarchy }}</td>-->
<!--        </tr>-->
<!--      </ng-template>-->
<!--    </p-treeTable>-->

<!--    <p-treeTable [value]="vehiclesTree" [paginator]="true" [rows]="10">-->
<!--      <ng-template pTemplate="header">-->
<!--        <tr>-->
<!--          <th>Team Hierarchy</th>-->
<!--          <th>Driver</th>-->
<!--          <th>License Plate</th>-->
<!--          <th>Category</th>-->
<!--        </tr>-->
<!--      </ng-template>-->
<!--      <ng-template pTemplate="body" let-node>-->
<!--        <tr>-->
<!--          <td>{{ node.label }}</td>-->
<!--          <td>{{ node.vehicle.driver ? node.vehicle.driver.firstName : 'No Driver' }}</td>-->
<!--          <td>{{ node.vehicle.licenseplate }}</td>-->
<!--          <td>{{ node.vehicle.category?.label }}</td>-->
<!--        </tr>-->
<!--      </ng-template>-->
<!--    </p-treeTable>-->

<!--    <p-treeTable [value]="vehiclesTree" >-->
<!--      <ng-template pTemplate="header">-->
<!--        <tr>-->
<!--          <th pSortableColumn="team">Team/Subteam</th>-->
<!--          <th pSortableColumn="licensePlate">License Plate</th>-->
<!--          <th pSortableColumn="driver">Driver</th>-->
<!--        </tr>-->
<!--      </ng-template>-->

<!--      <ng-template pTemplate="body" let-node let-expanded="expanded">-->
<!--        <tr [pSelectableRow]="node">-->
<!--          <td>{{ node.label }}</td>-->
<!--          <td>{{ node.data?.licenseplate || 'Unknown' }}</td>-->
<!--          <td>{{ node.data?.driver.lastName || 'Unknown' }}</td>  &lt;!&ndash; Display driver info &ndash;&gt;-->
<!--        </tr>-->
<!--      </ng-template>-->
<!--    </p-treeTable>-->



    <p-treeTable [value]="vehiclesTree" [tableStyle]="{ 'min-width': '600px' }">
      <!-- Define TreeTable Columns -->
      <ng-template pTemplate="header">
        <tr>
          <th>Label</th>
          <th>License Plate</th>
          <th>Driver Name</th>
        </tr>
      </ng-template>

      <!-- Define TreeTable Rows -->
      <ng-template pTemplate="body" let-rowNode let-rowData="rowNode.data">
        <tr>
          <!-- Label -->
          <td>{{ rowNode.label }}</td>

          <!-- License Plate -->
          <td>{{ rowData?.licenseplate || 'N/A' }}</td>

          <!-- Driver Name -->
          <td>{{ rowData?.driver.firstName || 'N/A' }}</td>
        </tr>
      </ng-template>
    </p-treeTable>





  `,
  styles: [`
    h1 {
      margin-bottom: 20px;
    }
    p-treeTable {
      margin: 20px;
    }

    p-treeTable th, p-treeTable td {
      text-align: left;
      padding: 8px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  selectedTags: { [key: string]: string[] } = {};
  protected unTrackedVehicle : String = "Liste des véhicules non-géolocalisés : ";
  vehicles: VehicleSummaryDTO[] = [];
  vehiclesTree: TreeNode[] = [];
  teamHierarchy:TeamHierarchyNode[];


  constructor(
    private filterService: FilterService,
    private readonly vehicleService: VehicleService,
    private readonly poiService: PoiService,
    private readonly geoCodingService:GeocodingService) {}

  ngOnInit() {
    // S'abonner aux filtres partagés
      this.filterService.filters$.subscribe(filters => {
      this.selectedTags = filters;
      this.subscribeToFilterChanges();

    });

  }

  // private subscribeToFilterChanges(): void {
  //   this.filterService.filters$.subscribe(filters => {
  //     const { agencies, vehicles, drivers } = filters;
  //
  //     this.vehicleService.getFilteredVehicless(agencies, vehicles, drivers)
  //       .subscribe(filteredVehicles => {
  //         console.log("Filtered vehicles received:", filteredVehicles);
  //
  //        //this.buildTree(filteredVehicles);
  //         this.buildVehiclesTree(filteredVehicles);
  //         //this.displayFilteredVehiclesOnDashboard(filteredVehicles);
  //       });
  //   });
  // }

  ////works to get poi
  // private subscribeToFilterChanges(): void {
  //   this.filterService.filters$.subscribe(filters => {
  //     const { agencies, vehicles, drivers } = filters;
  //
  //     this.vehicleService.getFilteredVehicless(agencies, vehicles, drivers)
  //       .subscribe(filteredVehicles => {
  //         console.log("Filtered vehicles received:", filteredVehicles);
  //
  //         const poiRequests = filteredVehicles.map(vehicle => {
  //           const lastPosition = vehicle.device.deviceDataState?.lastPosition;
  //           if (lastPosition && lastPosition.coordinates.length >= 2) {
  //             const [longitude, latitude] = lastPosition.coordinates;
  //
  //             return this.poiService.getNearestPOIsWithRadius(latitude, longitude)
  //               .pipe(
  //                 map(poi => ({ ...vehicle, nearestPOI: poi })),
  //                 catchError(err => {
  //                   console.error(`Failed to get POI for vehicle ${vehicle.id}:`, err);
  //                   return of({ ...vehicle, nearestPOI: null });
  //                 })
  //               );
  //           } else {
  //             return of({ ...vehicle, nearestPOI: null });
  //           }
  //         });
  //
  //         forkJoin(poiRequests).subscribe(vehiclesWithPOIs => {
  //           console.log("Vehicles with POIs:", vehiclesWithPOIs);
  //           this.buildVehiclesTree(vehiclesWithPOIs);
  //         });
  //       });
  //   });
  //
  // }

  private subscribeToFilterChanges(): void {
    this.filterService.filters$.subscribe(filters => {
      const {agencies, vehicles, drivers} = filters;

      // Fetch the filtered vehicles based on the selected filters
      this.vehicleService.getFilteredVehicless(agencies, vehicles, drivers).subscribe(filteredVehicles => {
        console.log("Filtered vehicles received:", filteredVehicles);
        //this.buildVehiclesTree(filteredVehicles);
        this.teamHierarchy=filteredVehicles
        console.log("teamHierarchy received=filtered:" ,this.teamHierarchy)
        this.vehiclesTree=this.transformToTreeNodes(filteredVehicles)
        console.log("vehicles tree node " ,this.vehiclesTree)

        // // Map each vehicle to process its POI and address details
        // const poiAndGeocodeRequests = filteredVehicles.map(vehicle => {
        //   const lastPosition = vehicle.device.deviceDataState?.lastPosition;
        //
        //   // Check if the vehicle has a valid last position with coordinates
        //   if (lastPosition && lastPosition.coordinates.length >= 2) {
        //     const [longitude, latitude] = lastPosition.coordinates;
        //     //console.log(`Processing POI for vehicle ${vehicle.id} at coordinates:`, lastPosition.coordinates);
        //     // console.log('hierarchy  ', vehicle.teamHierarchy)
        //
        //     return this.poiService.getNearestPOIsWithRadius(latitude, longitude).pipe(
        //       // Log the POI response to ensure the correct data is returned
        //       map(poi => {
        //         // Ensure POI and coordinates are present and valid
        //         if (poi && poi.coordinate && Array.isArray(poi.coordinate.coordinates)) {
        //           const coords = poi.coordinate.coordinates;
        //           if (coords.length === 2) {
        //             console.log(`Valid POI found for vehicle ${vehicle.id}:`, poi);
        //             return {...vehicle, nearestPOI: poi}; // POI is valid
        //           }
        //         }
        //
        //         console.warn(`POI not found or invalid for vehicle ${vehicle.id}. Returning vehicle with null POI.`);
        //         return {...vehicle, nearestPOI: null}; // POI is invalid
        //       }),
        //       catchError(err => {
        //         console.error(`Failed to get POI for vehicle ${vehicle.id}:`, err);
        //         return of({...vehicle, nearestPOI: null}); // Fallback to no POI on error
        //       })
        //     );
        //   } else {
        //     // If no lastPosition is available, return vehicle as-is with no POI
        //     console.warn(`Vehicle ${vehicle.id} has no valid last position.`);
        //     return of({...vehicle, nearestPOI: null});
        //   }
        // });
        //
        // // Wait for all POI and geocode requests to complete
        // forkJoin(poiAndGeocodeRequests).subscribe({
        //   next: vehiclesWithPOIs => {
        //     console.log("Vehicles with POIs:", vehiclesWithPOIs);
        //     this.buildVehiclesTree(vehiclesWithPOIs); // Update the hierarchical tree
        //   },
        //   error: err => {
        //     console.error("Error processing filtered vehicles:", err);
        //     // Optionally handle global error for the operation
        //   }
        // });
      });
    })
  };


  transformToTreeNodes(data: TeamHierarchyNode[]): TreeNode[] {
    return data.map((team) => ({
      label: team.label, // Team name
      children: [
        // Recursively transform subteams
        ...this.transformToTreeNodes(team.children || []),

        // Map vehicles to leaf nodes
        ...team.vehicles.map((vehicle: dto.VehicleTableDTO) => ({
          label: `Vehicle: ${vehicle.licenseplate}`, // Vehicle name
          data: vehicle, // Include the vehicle data
          leaf: true // Mark as a leaf node
        }))
      ]
    }));
  }

  // Function to transform flat vehicle data into a tree-like structure

  // buildTreeData(vehicles: VehicleTableDTO[]): any[] {
  //   const teamsMap: Map<string, Map<string, Map<string, { label: string, vehicle: VehicleTableDTO }[]>>> = new Map();
  //
  //   // Group vehicles by team hierarchy (teamHierarchy contains the full hierarchy path)
  //   vehicles.forEach(vehicle => {
  //     const hierarchy = vehicle.teamHierarchy.split(' > ');
  //
  //     // Create a nested structure for teams (3 levels deep in this case)
  //     let currentLevel: Map<string, VehicleTableDTO[]> = teamsMap;
  //
  //     hierarchy.forEach((team: string) => {
  //       // If team does not exist in the current level, create a new Map for it
  //       if (!currentLevel.has(team)) {
  //         currentLevel.set(team, new Map()); // Set a new Map at the next level
  //       }
  //
  //       // Update current level to the next nested map
  //       currentLevel = currentLevel.get(team)!; // Use non-null assertion because we know it exists after setting it
  //     });
  //
  //     // Now add the vehicle to the current team level
  //     currentLevel.push({
  //       label: vehicle.driver ? vehicle.driver.firstName : 'No Driver',
  //       vehicle: vehicle,
  //     });
  //   });
  //
  //   // Convert the map into a nested tree structure
  //   const mapToTree = (map: Map<any, any[]>): any[] => {
  //     const result: any[] = [];
  //     map.forEach((value, key) => {
  //       const node = {
  //         label: key,
  //         children: mapToTree(new Map(value)),
  //       };
  //       result.push(node);
  //     });
  //     return result;
  //   };
  //
  //   return mapToTree(teamsMap);
  // }
  //
  //





// //working
//   private buildVehiclesTree(vehicles: any[]): void {
//     const teamsMap = new Map<string, any[]>();
//
//     // Group vehicles by team
//     vehicles.forEach(vehicle => {
//       const teamName = vehicle.team.label || 'Sans équipe'; // Default to 'No Team'
//       if (!teamsMap.has(teamName)) {
//         teamsMap.set(teamName, []);
//       }
//       teamsMap.get(teamName)?.push(vehicle);
//     });
//
//     // Convert the grouped data into TreeNode[] structure
//     this.vehiclesTree = Array.from(teamsMap.entries()).map(([team, teamVehicles]) => ({
//       data: { team }, // Parent node contains only the team name
//       children: teamVehicles.map(vehicle => ({
//         data: {
//           team,
//           vehicle:vehicle,
//
//           // licenseplate: vehicle.licenseplate,
//           // driver: vehicle.driver?.firstName,
//           // category: vehicle.category.label,
//           // device: vehicle.device
//         }
//       }))
//     }));
//
//     console.log('Vehicles Tree:', this.vehiclesTree); // Debugging
//   }


  // private buildVehiclesTree(vehicles: any[]): void {
  //   const teamsMap = new Map<string, { team: any; vehicles: any[] }>();
  //
  //   // Helper function to find the full hierarchy of a team
  //   const buildTeamHierarchy = (team: any, hierarchy: string[] = []): string[] => {
  //     if (team) {
  //       hierarchy.unshift(team.label); // Add the current team label to the hierarchy
  //       if (team.parentTeam) {
  //         return buildTeamHierarchy(team.parentTeam, hierarchy); // Recursively add parent team labels
  //       }
  //     }
  //     return hierarchy;
  //   };
  //
  //   // Group vehicles by their complete team hierarchy
  //   vehicles.forEach(vehicle => {
  //     const team = vehicle.team;
  //     const hierarchy = team ? buildTeamHierarchy(team).join(' > ') : 'Sans équipe'; // Build hierarchy string
  //     if (!teamsMap.has(hierarchy)) {
  //       teamsMap.set(hierarchy, { team, vehicles: [] });
  //     }
  //     teamsMap.get(hierarchy)?.vehicles.push(vehicle);
  //   });
  //
  //   // Convert the grouped data into TreeNode[] structure
  //   this.vehiclesTree = Array.from(teamsMap.entries()).map(([hierarchy, { team, vehicles }]) => {
  //     const teamHierarchy = hierarchy.split(' > ');
  //     let parentNode: any = null;
  //     let currentLevel: any = null;
  //
  //     // Build the hierarchy tree for the team
  //     teamHierarchy.forEach((teamName, index) => {
  //       const isLastLevel = index === teamHierarchy.length - 1;
  //
  //       // Create a new node for the current level
  //       const newNode = {
  //         data: { team: teamName },
  //         children: isLastLevel
  //           ? vehicles.map(vehicle => ({
  //             data: {
  //               team: teamName,
  //               vehicle: vehicle,
  //             }
  //           }))
  //           : []
  //       };
  //
  //       // Link the current level to the parent level
  //       if (parentNode) {
  //         const existingNode = parentNode.children.find((child: any) => child.data.team === teamName);
  //         if (!existingNode) {
  //           parentNode.children.push(newNode);
  //           currentLevel = newNode;
  //         } else {
  //           currentLevel = existingNode;
  //         }
  //       } else {
  //         currentLevel = newNode;
  //         if (!this.vehiclesTree) this.vehiclesTree = [];
  //         this.vehiclesTree.push(currentLevel);
  //       }
  //
  //       parentNode = currentLevel;
  //     });
  //
  //     return parentNode; // Return the root node for the team hierarchy
  //   }).filter((node: any) => node !== undefined); // Filter out any undefined nodes
  //
  //   console.log('Vehicles Tree:', this.vehiclesTree); // Debugging
  // }



  // private buildVehiclesTree(vehicles: VehicleTableDTO[]): void {
  //   // Step 1: Create a map of teams by their ID
  //   const teamsMap = new Map<number, TeamDTO>();
  //   const vehiclesByTeamId = new Map<number, VehicleTableDTO[]>();
  //
  //   // Step 2: Organize vehicles by their team IDs
  //   vehicles.forEach(vehicle => {
  //     const team = vehicle.team;
  //     const teamId = team.id;
  //
  //     // Store the team reference
  //     if (!teamsMap.has(teamId)) {
  //       teamsMap.set(teamId, team);
  //     }
  //
  //     // Store the vehicles under their team ID
  //     if (!vehiclesByTeamId.has(teamId)) {
  //       vehiclesByTeamId.set(teamId, []);
  //     }
  //     vehiclesByTeamId.get(teamId)?.push(vehicle);
  //   });
  //
  //   // Step 3: Function to build the tree recursively for teams
  //   const buildTree = (team: TeamDTO): any => {
  //     // Find the vehicles associated with this team
  //     const teamVehicles = vehiclesByTeamId.get(team.id) || [];
  //
  //     // Find any sub-teams (those where the parent team is the current team)
  //     const subTeams = Array.from(teamsMap.values()).filter(t => t.parentTeam?.id === team.id);
  //
  //     // Recursively build the tree for sub-teams
  //     const subTeamNodes = subTeams.map(subTeam => ({
  //       data: { team: subTeam },
  //       children: buildTree(subTeam) // Recursive call for sub-teams
  //     }));
  //
  //     // Return the final node for this team (including sub-teams and vehicles)
  //     return [{
  //       data: { team }, // This is the current team node
  //       children: [
  //         ...subTeamNodes, // Child nodes for sub-teams
  //         ...teamVehicles.map(vehicle => ({
  //           data: { vehicle }, // Vehicle data for leaf nodes
  //           children: [] // Vehicles are leaf nodes (no further children)
  //         }))
  //       ]
  //     }];
  //   };
  //
  //   // Step 4: Build the tree starting from the top-level teams (those without a parent)
  //   const rootTeams = Array.from(teamsMap.values()).filter(team => !team.parentTeam);
  //
  //   // Construct the final tree structure
  //   this.vehiclesTree = rootTeams.flatMap(team => buildTree(team));
  //
  //   console.log('Vehicles Tree:', this.vehiclesTree); // Debugging output to check the tree structure
  // }
  //



  private displayFilteredVehiclesOnDashboard(vehicles: any[]): void {
    this.unTrackedVehicle = "Liste des véhicules non-géolocalisés : ";
    this.vehicles = vehicles;  // Assign filtered vehicles to vehicles array

    vehicles.forEach(vehicle => {
      if (vehicle.device?.coordinate) {

        console.log('hellooooooooooooo');
        //console.log(vehicle.device?.coordinate);
        // Handle geolocated vehicles, potentially for map rendering
      } else {
        this.unTrackedVehicle += `${vehicle.licenseplate} /// `;
      }
    });
  }


}

