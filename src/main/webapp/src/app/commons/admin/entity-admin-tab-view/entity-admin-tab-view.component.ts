import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {IEntityService} from "../../crud/interface/ientity-service";
import {EntityTreeComponent} from "../entity-tree/entity-tree.component";
import {EntityStatsComponent} from "../entity-stats/entity-stats.component";
import {AsyncPipe, NgIf} from "@angular/common";
import {LoadingService} from "../../../services/loading.service";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {CompOpenerButtonComponent} from "../../drawer/comp-opener-button.component";
import {DrawerOptions} from "../../drawer/drawer.component";

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

      <hr *ngIf="config.showStats && config.showTree"/>

      <app-comp-opener-button
        *ngIf="service"
        [showLabel]="true"
        label="Créer une entité"
        icon="pi pi-plus"
        [drawerOptions]="service?.getDrawerOptions(null)"
      ></app-comp-opener-button>

      <app-entity-tree
        *ngIf="config.showTree"
        [entityName]="entityName"
        [entityService]="service"
      ></app-entity-tree>
    </div>
  `,
  standalone: true,
  imports: [
    EntityTreeComponent,
    EntityStatsComponent,
    NgIf,
    ProgressSpinnerModule,
    CompOpenerButtonComponent
  ],
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

  @Input() service?: IEntityService<any, any>;



  ngOnInit(): void {}

}
