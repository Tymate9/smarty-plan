import { Component, Input, Output, EventEmitter } from '@angular/core';
import {Dialog} from "primeng/dialog";
import {TableModule} from "primeng/table";
import {Button} from "primeng/button";
import {NgForOf, NgIf, NgStyle} from "@angular/common";

@Component({
  selector: 'app-vehicle-stats-dialog',
  template: `
    <p-dialog [(visible)]="displayDialog"
              [modal]="true"
              [header]="dialogHeader"
              [style]="{width: '60vw'}"
              [draggable]="false"
              (onHide)="closeDialog()">
      <div class="table-container">
        <p-table [value]="tableData" showGridlines stripedRows>
          <ng-template pTemplate="header">
            <tr>
              <th *ngFor="let col of columns">{{ col.header }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-data>
            <tr>
              <td *ngFor="let col of columns"
                  [ngStyle]="col.style ? col.style(data) : {}">
                <ng-container *ngIf="!col.button">{{ data[col.field] }}</ng-container>
                <p-button *ngIf="col.button"
                          icon="pi pi-info-circle"
                          (click)="col.button(data)"></p-button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </p-dialog>
  `,
  imports: [
    Dialog,
    TableModule,
    Button,
    NgStyle,
    NgForOf,
    NgIf
  ],
  styles: [`
    .table-container {
      max-height: 400px;
      overflow-y: auto;
    }
  `]
})
export class VehicleStatsDialogComponent {
  @Input() displayDialog = false;
  @Input() dialogHeader = '';
  @Input() tableData: any[] = [];
  @Input() columns: { field: string; header: string; style?: (data: any) => any; button?: (data: any) => void }[] = [];

  @Output() close = new EventEmitter<void>();

  closeDialog() {
    this.close.emit();
  }
}
