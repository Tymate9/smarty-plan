import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  AfterViewInit,
  ViewChildren,
  QueryList,
  Type
} from '@angular/core';
import { IEntityService } from '../../CRUD/ientity-service';
import { TreeNode } from 'primeng/api';
import { CellHostDirective } from '../../cell-host.directive';
import { forkJoin } from 'rxjs';
import {TreeTableModule} from "primeng/treetable";
import {NgForOf, NgIf} from "@angular/common";

export interface EntityColumn {
  field?: string;
  header: string;
  ascending?: boolean;
  comparator?: (valA: any, valB: any, asc: boolean) => number;
  isDynamic?: boolean;
}

interface DynamicComponentConfig {
  compClass: Type<any>;
  inputs?: { [key: string]: any };
}

@Component({
  selector: 'app-entity-tree',
  template: `
    <div class="entity-tree-container">
      <h4>Liste pour {{ entityName }}</h4>

      <div *ngIf="loading">Chargement en cours...</div>
      <div *ngIf="errorMsg" class="error">{{ errorMsg }}</div>

      <ul *ngIf="!loading && !errorMsg">
        <li *ngFor="let item of items">
          {{ item.label }}
        </li>
      </ul>
    </div>

    <p-treeTable
      [value]="treeData"
      (onNodeExpand)="handleExpand($event)"
      (onNodeCollapse)="handleCollapse($event)"
    >
      <ng-template pTemplate="colgroup">
        <colgroup>
          <col *ngFor="let col of columns">
        </colgroup>
      </ng-template>

      <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
        <!-- Nœud parent -->
        <tr class="dynamic-tt-parent-node">
          <td
            *ngIf="rowNode.node.children?.length > 0"
            [attr.colspan]="columns.length"
          >
            <p-treeTableToggler class="dynamic-tt-togglerButton" [rowNode]="rowNode"></p-treeTableToggler>
            {{ rowNode.node?.label }}
          </td>
        </tr>

        <!-- En-tête si racine expandée -->
        <ng-container *ngIf="!rowNode.parent && rowNode.node?.expanded">
          <tr class="dynamic-tt-header">
            <td [ttRow]="rowNode" *ngFor="let col of columns">
              <span>{{ col.header }}</span>
              <button
                *ngIf="col.field && col.comparator"
                (click)="onColumnHeaderClick(col)"
              >
                Trier
              </button>
              <span *ngIf="col.field && col.comparator">
                ({{ col.ascending ? 'Asc' : 'Desc' }})
              </span>
            </td>
          </tr>
        </ng-container>

        <!-- Feuilles -->
        <tr class="dynamic-tt-leaf">
          <ng-container *ngFor="let col of columns">
            <td *ngIf="!(rowNode.node.children?.length > 0)">
              <ng-container *ngIf="!col.isDynamic">
                {{ col.field ? (rowData[col.field] || '-') : '-' }}
              </ng-container>

              <ng-template
                *ngIf="col.isDynamic"
                cellHost
                [col]="col"
                [rowData]="rowData"
                [treeNode]="rowNode.node"
              ></ng-template>
            </td>
          </ng-container>
        </tr>
      </ng-template>
    </p-treeTable>
  `,
  standalone: true,
  imports: [
    TreeTableModule,
    CellHostDirective,
    NgIf,
    NgForOf
  ],
  styles: [`

    .entity-tree-container {
      background-color: #fafafa;
      border: 1px solid #ddd;
      padding: 12px;
      margin: 12px 0;
    }

    .error {
      color: red;
      font-weight: bold;
    }
  `]
})
export class EntityTreeComponent implements OnInit/*, AfterViewInit*/ {
  @Input() entityName: string = '';
  @Input() entityService?: IEntityService<any, any>;

  items: any[] = [];

  columns: EntityColumn[] = [];

  treeData: TreeNode[] = [];

  loading: boolean = false;

  errorMsg: string | null = null;

  @ViewChildren(CellHostDirective) cellHosts!: QueryList<CellHostDirective>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.entityService) {
      this.errorMsg = 'Aucun service fourni.';
      return;
    }
    this.loading = true;

    forkJoin({
      data: this.entityService.getAuthorizedData(),
      cols: this.entityService.getTreeColumns(),
      nodes: this.entityService.getTreeNodes()
    }).subscribe({
      next: (results) => {
        this.items = results.data;
        this.columns = results.cols;
        this.treeData = this.sortTreeNodes(results.nodes);

        this.loading = false;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.reInjectDynamicComponents();
        }, 0);
      },
      error: (err) => {
        console.error('Erreur forkJoin', err);
        this.errorMsg = 'Erreur lors du chargement des données.';
        this.loading = false;
      }
    });
  }

  handleExpand(event: any): void {
    this.cdr.detectChanges();

    setTimeout(() => {
      this.reInjectDynamicComponents();
    }, 10);
  }

  handleCollapse(event: any): void {
    this.cdr.detectChanges();

    setTimeout(() => {
      this.reInjectDynamicComponents();
    }, 10);
  }

  private reInjectDynamicComponents(): void {

    const hosts = this.cellHosts.toArray();
    for (const hostDirective of hosts) {
      if (hostDirective.col?.isDynamic) {
        this.createDynamicComponentsForColumn(hostDirective);
      }
    }
    this.cdr.detectChanges();
  }

  private createDynamicComponentsForColumn(host: CellHostDirective): void {
    host.viewContainerRef.clear();

    const node = host.treeNode;
    const col = host.col;

    if (!col) return;

    const dynamicCmpMap = node.data?.dynamicComponents || {};
    const colKey = col.field || col.header;
    if (!colKey) {
      return;
    }

    const cmpConfigs: DynamicComponentConfig[] = dynamicCmpMap[colKey] || [];

    for (const cfg of cmpConfigs) {
      const compClass = cfg.compClass;
      if (!compClass) {
        continue;
      }

      const compRef = host.viewContainerRef.createComponent(compClass);

      const inputs = cfg.inputs || {};
      Object.keys(inputs).forEach((key) => {
        (compRef.instance as any)[key] = inputs[key];
      });
    }
  }

  private sortTreeNodes(nodes: TreeNode[]): TreeNode[] {
    // Tri global
    return nodes
      .map((node) => {
        if (node.children && node.children.length > 0) {
          node.children = this.sortTreeNodes(node.children);
        }
        return node;
      })
      .sort((a, b) => {
        const hasChildrenA = !!(a.children && a.children.length);
        const hasChildrenB = !!(b.children && b.children.length);
        if (!hasChildrenA && hasChildrenB) return -1;
        if (hasChildrenA && !hasChildrenB) return 1;
        return 0;
      });
  }

  private sortLeavesInNodes(nodes: TreeNode[],comparator: (valA: any, valB: any) => number,header: string ): TreeNode[] {
    if (!nodes || nodes.length === 0) {
      return nodes;
    }
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        this.sortLeavesInNodes(node.children, comparator, header);

        const leafIndices: number[] = [];
        const leafNodes: TreeNode[] = [];

        node.children.forEach((child, idx) => {
          const isLeaf = !child.children || child.children.length === 0;
          if (isLeaf) {
            leafIndices.push(idx);
            leafNodes.push(child);
          }
        });

        leafNodes.sort((a, b) => {
          const valA = a.data?.[header] ?? '';
          const valB = b.data?.[header] ?? '';
          return comparator(valA, valB);
        });

        leafIndices.forEach((leafIndex, i) => {
          node.children![leafIndex] = leafNodes[i];
        });
        node.children = [...node.children];
      }
    }
    return nodes;
  }

  onColumnHeaderClick(col: EntityColumn): void {
    col.ascending = !col.ascending;
    if (col.field && col.comparator) {
      const sorted = this.sortLeavesInNodes(
        this.treeData,
        (valA, valB) => col.comparator!(valA, valB, col.ascending!),
        col.field
      );
      this.treeData = [...sorted];
      this.cdr.markForCheck();

      setTimeout(() => {
        this.reInjectDynamicComponents();
      }, 10);
    }
  }
}
