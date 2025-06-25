import {Component, Input} from '@angular/core';
import {NgClass, NgIf, NgStyle} from "@angular/common";
import {Button} from "primeng/button";
import {ProgressSpinner} from "primeng/progressspinner";
import {IEntityService} from "../crud/interface/ientity-service";

@Component({
  selector: 'app-export-csv-button',
  template: `
    <p-button type="button" (click)="onClickExport()" [disabled]="loading" >
      <i *ngIf="iconClass" [ngClass]="iconClass" style="margin-right: 0.5rem;"></i>
      <span *ngIf="!loading">{{ buttonText }}</span>
      <p-progressSpinner *ngIf="loading" styleClass="custom-spinner"
                         [style]="{'width': '20px', 'height': '20px'}"></p-progressSpinner>
    </p-button>
  `,
  imports: [
    Button,
    NgClass,
    NgIf,
    ProgressSpinner,
    NgStyle
  ],
  styles: [`
    .custom-spinner {
      margin-left: 0.5rem;
    }
  `]
})
export class ExportCsvButtonComponent {
  /**
   * Texte affiché sur le bouton.
   */
  @Input() buttonText: string = 'Exporter CSV';

  /**
   * Classe d'icône PrimeNG à afficher dans le bouton.
   */
  @Input() iconClass: string = '';

  /**
   * Service implémentant IEntityService, qui fournit à la fois les données et les méthodes CSV.
   */
  @Input() dataService!: IEntityService<any, any>;

  loading: boolean = false;

  constructor() {}

  /**
   * Récupère les données via le service, génère le CSV en utilisant les méthodes du service,
   * puis déclenche le téléchargement du fichier.
   */
  onClickExport(): void {
    if (!this.dataService) {
      console.error("Aucun service n'a été fourni pour l'export CSV.");
      return;
    }
    this.loading = true;
    this.dataService.getAuthorizedData().subscribe({
      next: (data: any[]) => {
        const headers = this.dataService.getCsvHeaders();
        const headerLine = headers.join(',');
        // Appliquer la méthode convertToCsv de l'interface sur chaque objet
        const rows = data.map(item => this.dataService.convertToCsv(item));
        const csvContent = headerLine + '\r\n' + rows.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'export.csv';
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des données :', err);
        this.loading = false;
      }
    });
  }
}
