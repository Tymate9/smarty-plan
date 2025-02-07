import {Component, OnInit} from '@angular/core';
import {IEntityService} from "../../CRUD/ientity-service";
import {TeamService} from "../../../../features/vehicle/team.service";
import {EntityButtonTabContentComponent} from "../entity-button-tab-content/entity-button-tab-content.component";
import {EntityAdminTabViewComponent} from "../entity-admin-tab-view/entity-admin-tab-view.component";
import {NgClass} from "@angular/common";

/**
 * On peut étendre cette interface selon les besoins
 * (icône, service, etc.).
 */
export interface EntityDefinition {
  name: string;
  count: number;
  icon?: string;
  iconType?: 'url' | 'css';
  service: IEntityService<any, any>;
}

@Component({
  selector: 'app-entity-admin',
  template: `
    <div class="tabs-container">
      <app-entity-button-tab-content
        *ngFor="let ent of entities"
        [label]="ent.name + ' (' + ent.count + ')'"
        [icon]="ent.icon"
        [iconType]="ent.iconType ?? 'css'"
        [ngClass]="{'selected': ent === selectedEntity}"
        (clicked)="selectEntity(ent)"
      ></app-entity-button-tab-content>
    </div>

    <div class="content-container" *ngIf="selectedEntity">
      <app-entity-admin-tab-view
        [entityName]="selectedEntity.name"
        [service]="selectedEntity.service"
        [config]="{ showStats: true, showTree: true }"
      >
      </app-entity-admin-tab-view>
    </div>
  `,
  standalone: true,
  imports: [
    EntityButtonTabContentComponent,
    EntityAdminTabViewComponent,
    NgClass
  ],
  styles: [`
    .tabs-container {
      display: flex;
      gap: 8px;
      padding: 8px;
      background-color: #f5f5f5;
      border-bottom: 2px solid #ccc;
    }

    .content-container {
      padding: 16px;
    }

    .selected {
      border-bottom: 2px solid #666;
      background-color: #e0e0e0;
      font-weight: bold;
    }
  `]
})
export class EntityAdminComponent implements OnInit {

  public entities: EntityDefinition[] = [
    {
      name: 'Teams',
      count: 0,
      icon: 'pi pi-users',
      iconType: 'css',
      service: this.teamService
    },
    {
      name: 'Drivers',
      count: 0,
      icon: 'pi pi-id-card',
      iconType: 'css',
      service: this.teamService
    },
    {
      name: 'Vehicles',
      count: 0,
      icon: 'pi pi-car',
      iconType: 'css',
      service: this.teamService
    }
  ];

  public selectedEntity: EntityDefinition;

  constructor(
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    // Au démarrage, on charge le count pour chaque entité
    this.entities.forEach(ent => {
      ent.service.getCount().subscribe({
        next: (cnt) => {
          ent.count = cnt;
        },
        error: (err) => {
          console.error(`Erreur getCount() pour ${ent.name}`, err);
          ent.count = -1; // ou tout autre indication d’erreur
        }
      });
    });

    // Sélectionner la première entité si présente
    if (this.entities.length > 0) {
      this.selectedEntity = this.entities[0];
    }
  }

  selectEntity(ent: EntityDefinition): void {
    this.selectedEntity = ent;
  }
}
