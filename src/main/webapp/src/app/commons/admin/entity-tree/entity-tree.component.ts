import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  Type, SimpleChanges, OnChanges, OnDestroy
} from '@angular/core';
import {CrudEventType, IEntityService} from '../../crud/interface/ientity-service';
import { TreeNode } from 'primeng/api';
import { CellHostDirective } from './cell-host.directive';
import {forkJoin, Subscription} from 'rxjs';
import {TreeTableModule} from "primeng/treetable";
import {AsyncPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {Button} from "primeng/button";
import {LoadingService} from "../../../services/loading.service";
import {ProgressSpinner} from "primeng/progressspinner";

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
    <!-- Spinner local au composant -->
    <p-progressSpinner *ngIf="(loadingService.loading$ | async)"></p-progressSpinner>

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
        <tr [ngClass]="{'dynamic-tt-parent-node': !rowNode.parent, 'simple-tt-parent-node': rowNode.parent}">
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
              <p-button
                *ngIf="col.field && col.comparator"
                (click)="onColumnHeaderClick(col)"
                [icon]="col.ascending ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
              >
              </p-button>
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
    </p-treeTable>  `,
  standalone: true,
  imports: [
    TreeTableModule,
    CellHostDirective,
    NgIf,
    NgForOf,
    NgClass,
    Button,
    ProgressSpinner,
    AsyncPipe
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
  `],
  providers: [LoadingService]
})
export class EntityTreeComponent implements OnInit, OnChanges, OnDestroy{
  @Input() entityName: string = '';
  @Input() entityService?: IEntityService<any, any>;

  private crudSubscription?: Subscription;

  items: any[] = [];

  columns: EntityColumn[] = [];

  treeData: TreeNode[] = [];

  errorMsg: string | null = null;

  @ViewChildren(CellHostDirective) cellHosts!: QueryList<CellHostDirective>;

  constructor(
    private cdr: ChangeDetectorRef,
    public loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loadData();
    });
    if (this.entityService) {
      this.subscribeToCrudEvents();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityService'] && !changes['entityService'].firstChange) {
      this.treeData = [];
      setTimeout(() => {
        this.loadData();
      });
      if (this.crudSubscription) {
        this.crudSubscription.unsubscribe();
      }
      if (this.entityService) {
        this.subscribeToCrudEvents();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.crudSubscription) {
      this.crudSubscription.unsubscribe();
    }
  }

  private subscribeToCrudEvents(): void {
    this.crudSubscription = this.entityService!.crudEvents$.subscribe(event => {
      switch (event.type) {
        case CrudEventType.CREATE:
          this.handleCreateEvent(event.newData);
          break;
        case CrudEventType.UPDATE:
          this.handleUpdateEvent(event.oldData, event.newData);
          break;
        case CrudEventType.DELETE:
          this.handleDeleteEvent(event.oldData);
          break;
        default:
          console.warn('[EntityTreeComponent] Événement CRUD inconnu:', event);
      }
      this.cdr.markForCheck();
    });
  }

  private handleCreateEvent(newData: any): void {
    if (!newData || newData.id === undefined || newData.id === null) {
      console.error("Création impossible : l'objet créé ne possède aucun id valide.", newData);
      return;
    }
    if (!this.entityService) {
      console.error("Aucun service défini pour effectuer la création.");
      return;
    }

    // Construire la nouvelle feuille via le service
    const newLeaf = this.entityService.buildTreeLeaf(newData);

    // Utiliser la fonction utilitaire pour insérer le nouveau nœud dans le bon groupe
    this.updateTreeWithNewLeaf(newLeaf);
  }

  private handleUpdateEvent(oldData: any, updatedData: any): void {
    if (!updatedData || updatedData.id === undefined || updatedData.id === null) {
      console.error("Mise à jour impossible : l'objet mis à jour ne possède aucun id valide.", updatedData);
      return;
    }
    if (!this.entityService) {
      console.error("Aucun service défini pour effectuer la mise à jour.");
      return;
    }

    // Supprimer l'ancien nœud correspondant à oldData
    if (oldData && oldData.id != null) {
      const removed = this.removeNodeFromGroup(oldData.id);
      if (!removed) {
        console.warn("Impossible de trouver l'ancien nœud à supprimer pour la mise à jour (id=", oldData.id, ")");
      } else {
        console.warn('[handleUpdateEvent] Ancien nœud supprimé pour id', oldData.id);
      }
    }

    // Construire le nouveau nœud à partir de updatedData
    const newLeaf = this.entityService.buildTreeLeaf(updatedData);
    // Insérer le nouveau nœud dans le groupe approprié
    this.updateTreeWithNewLeaf(newLeaf);
  }

  private handleDeleteEvent(oldData: any): void {
    // Vérifier que l'objet à supprimer possède un id
    if (!oldData || oldData.id === undefined || oldData.id === null) {
      console.error("Suppression impossible : l'objet supprimé ne possède aucun id valide.");
      return;
    }
    if (!this.entityService) {
      console.error("Aucun service défini pour effectuer la suppression.");
      return;
    }

    let removed = this.removeNodeFromGroup(oldData.id);
    if (!removed) {
      console.warn("Nœud avec id", oldData.id, "non trouvé pour la suppression.");
    }

    this.treeData = [...this.treeData];
    this.cdr.detectChanges();

    setTimeout(() => {
      this.reInjectDynamicComponents();
    }, 10);
  }

  private removeNodeFromGroup(nodeId: any, nodes: TreeNode[] = this.treeData): boolean {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // 1) Vérifie si le nœud courant est lui-même celui à supprimer
      if (node.data && node.data.id === nodeId) {
        nodes.splice(i, 1);
        return true;
      }

      // 2) S'il a des enfants, on procède de la même manière pour eux
      if (node.children && Array.isArray(node.children)) {
        // a) Chercher directement dans les enfants
        const idx = node.children.findIndex(child => child.data && child.data.id === nodeId);
        if (idx !== -1) {
          // Supprimer l'enfant trouvé
          node.children.splice(idx, 1);

          // Optionnel : si plus d’enfants, on supprime également le groupe
          if (node.children.length === 0) {
            nodes.splice(i, 1);
          }
          return true;
        }

        // b) Non trouvé dans les enfants immédiats : descente récursive
        for (let j = 0; j < node.children.length; j++) {
          const child = node.children[j];

          if (child.children && child.children.length > 0) {
            const removed = this.removeNodeFromGroup(nodeId, child.children);

            if (removed) {
              // Si l’enfant n’a plus de sous‐enfants après la suppression, on le retire
              if (child.children.length === 0) {
                node.children.splice(j, 1);

                // Si le nœud parent n’a plus d’enfants, on supprime également ce parent
                if (node.children.length === 0) {
                  nodes.splice(i, 1);
                }
              }
              return true;
            }
          }
        }
      }
    }

    // Si on sort de la boucle sans avoir supprimé, on renvoie false
    return false;
  }

  private updateTreeWithNewLeaf(newLeaf: TreeNode): void {
    // Extraction et conversion du parentId
    const groupId = newLeaf.data.parentId ? newLeaf.data.parentId.toString() : "-1";

    // Détermination du label à utiliser pour le groupe
    const groupLabel: string = newLeaf.data.parentLabel
      ? newLeaf.data.parentLabel
      : (groupId === "-1" ? "Orphan" : `Groupe ${groupId}`);

    // Recherche du groupe correspondant dans l'arbre
    let group = this.findGroupInTree(this.treeData, groupId);

    if (!group) {
      // Si aucun groupe correspondant n'est trouvé, on le crée en utilisant le libellé approprié.
      group = {
        label: groupLabel,
        data: {
          groupId: groupId,
        },
        expanded: false,
        children: []
      };
      this.treeData.unshift(group);
    }

    // Ajout de la nouvelle feuille dans le groupe
    group.children?.unshift(newLeaf);

    // Réassignation de l'arbre pour déclencher la détection des changements
    this.treeData = [...this.treeData];
    this.cdr.detectChanges();

    setTimeout(() => {
      this.reInjectDynamicComponents();
    }, 10);
  }

  private findGroupInTree(nodes: TreeNode[], groupId: string): TreeNode | undefined {
    for (const node of nodes) {
      if (node.data && node.data.groupId?.toString() === groupId.toString()) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = this.findGroupInTree(node.children, groupId);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  private loadData(): void {
    if (!this.entityService) {
      this.errorMsg = 'Aucun service fourni.';
      return;
    }

    // Active le loader local + le spinner global
    this.loadingService.setLoading(true);

    forkJoin({
      data: this.entityService.getAuthorizedData(),
      cols: this.entityService.getTreeColumns(),
      nodes: this.entityService.getTreeNodes()
    }).subscribe({
      next: (results) => {
        this.items = results.data;
        this.columns = results.cols;
        this.treeData = this.sortTreeNodes(results.nodes);

        setTimeout(() => {
          this.reInjectDynamicComponents();
        }, 0);
      },
      error: (err) => {
        console.error('Erreur forkJoin', err);
        this.errorMsg = 'Erreur lors du chargement des données.';
      },
      complete: () => {
        this.loadingService.setLoading(false);
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
