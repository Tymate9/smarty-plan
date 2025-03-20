import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {IEntityService} from "../../CRUD/ientity-service";
import {EntityTreeComponent} from "../entity-tree/entity-tree.component";
import {EntityStatsComponent} from "../entity-stats/entity-stats.component";
import {NgIf} from "@angular/common";

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
    NgIf
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

  // On reçoit le service depuis le parent
  @Input() service?: IEntityService<any, any>;

  ngOnInit(): void {
    console.log('ngOnInit - service:', this.service);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['service']) {
      console.log('ngOnChanges - service changed:', changes['service'].currentValue);
      console.log(this.service)
    }
  }

}
