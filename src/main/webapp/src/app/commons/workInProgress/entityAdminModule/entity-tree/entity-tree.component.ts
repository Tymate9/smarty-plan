import { Component, Input, OnInit } from '@angular/core';
import {IEntityService} from "../../CRUD/ientity-service";
import {TreeNode} from "primeng/api";

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
    <!-- On utilise p-treeTable pour afficher plusieurs colonnes -->
    <p-treeTable [value]="testTree">

      <!-- Définition des largeurs de colonnes (optionnel) -->
      <ng-template pTemplate="colgroup">
        <colgroup>
          <col style="width: 40%;">
          <col style="width: 30%;">
          <col style="width: 30%;">
        </colgroup>
      </ng-template>
      <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
        <!-- En-tête du tableau -->
        <ng-template pTemplate="header">
          <tr>
            <th>Label</th>
            <th>Type</th>
            <th>Parent Team</th>
          </tr>
        </ng-template>

        <tr>
          <td>
            <p-treeTableToggler [rowNode]="rowNode"></p-treeTableToggler>
            {{ rowData.label }}
          </td>
          <td>
            {{ rowData.type }}
          </td>
          <td>
            {{ rowData.parentTeam }}
          </td>
        </tr>
      </ng-template>

    </p-treeTable>
  `,
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
export class EntityTreeComponent implements OnInit {
  @Input() entityName: string = '';
  @Input() entityService?: IEntityService<any, any>;

  items: any[] = [];
  loading: boolean = false;
  errorMsg: string | null = null;
  testTree: TreeNode[] = [
    {

      data: {label: 'Agence'},   // Optionnel
      expanded: true,
      children: [
        {
          data: { label: 'Groupe A1', type: 'Agence', parentTeam: null },
          expanded: false,
          children: []
        },
        {
          data: { label: 'Groupe A2', type: 'Agence', parentTeam: null },
          expanded: false,
          children: []
        },
        {
          data: { label: 'Groupe A3', type: 'Agence', parentTeam: null },
          expanded: false,
          children: []
        }
      ]
    },
    {

      data: { label: 'Service'},   // Optionnel
      expanded: true,
      children: [
        {
          data: { label: 'Groupe S1', type: 'Service', parentTeam: 'Agence A1' },
          expanded: false,
          children: []
        },
        {
          data: { label: 'Groupe S2',type: 'Service', parentTeam: 'Agence A2' },
          expanded: false,
          children: []
        },
        {
          data: { label: 'Groupe S3', type: 'Service', parentTeam: 'Agence A3' },
          expanded: false,
          children: []
        }
      ]
    }
  ];

  ngOnInit(): void {
    if (!this.entityService) {
      this.errorMsg = 'Aucun service fourni.';
      return;
    }
    this.loading = true;

    this.entityService.getAuthorizedData().subscribe({
      next: (data : any) => {
        this.items = data;
        this.loading = false;
      },
      error: (err : any) => {
        console.error('Erreur getAuthorizedData', err);
        this.errorMsg = 'Erreur lors du chargement de la liste.';
        this.loading = false;
      }
    });
  }
}
