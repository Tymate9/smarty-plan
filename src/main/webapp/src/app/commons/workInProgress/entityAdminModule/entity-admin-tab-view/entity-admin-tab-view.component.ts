import { Component, Input, OnInit } from '@angular/core';
import {IEntityService} from "../../CRUD/ientity-service";

export interface EntityAdminTabConfig {
  showStats?: boolean;
  showTree?: boolean;
}

@Component({
  selector: 'app-entity-admin-tab-view',
  template: `
    <div class="tab-view-container">

      <app-entity-stats
        *ngIf="config.showStats"
        [entityName]="entityName"
        [entityService]="service"
      ></app-entity-stats>

      <hr *ngIf="config.showStats && config.showTree" />

      <app-entity-tree
        *ngIf="config.showTree"
        [entityName]="entityName"
        [entityService]="service"
      ></app-entity-tree>

    </div>
  `,
  styles: [`
    .tab-view-container {
      background-color: #f0f7ff;
      padding: 16px;
      border: 1px solid #ccc;
    }
    hr {
      margin: 16px 0;
    }
  `]
})
export class EntityAdminTabViewComponent implements OnInit {
  @Input() entityName: string = 'Unknown';
  @Input() config: EntityAdminTabConfig = { showStats: true, showTree: true };

  // On reçoit le service depuis le parent
  @Input() service?: IEntityService<any, any>;

  ngOnInit(): void {
    // rien de spécial
  }
}
