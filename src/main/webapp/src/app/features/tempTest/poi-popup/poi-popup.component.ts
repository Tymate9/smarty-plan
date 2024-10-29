// src/app/components/poi-popup/poi-popup.component.ts
import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import { PoiService} from "../../POI/poi.service";
import * as turf from '@turf/turf';


@Component({
  selector: 'app-poi-popup',
  template: `
    <div>
      <h4>Modifier le POI</h4>
      <form (ngSubmit)="submitUpdate()">
        <label for="label">Nom :</label>
        <input type="text" id="label" [(ngModel)]="updatedPoi.label" name="label"><br>

        <label for="type">Type :</label>
        <input type="number" id="type" [(ngModel)]="updatedPoi.type" name="type"><br>

        <label for="radius">Rayon (mètres) :</label>
        <input type="number" id="radius" [(ngModel)]="updatedPoi.radius" name="radius"><br>

        <button type="submit">Mettre à jour</button>
      </form>
      <button (click)="deletePOI()">Supprimer le POI</button>
    </div>
  `,
})
export class PoiPopupComponent implements OnInit {
  @Input() poi: any;
  @Output() poiDeleted = new EventEmitter<number>();
  @Output() poiUpdated = new EventEmitter<any>();



  updatedPoi: { label: string; type: number; radius: number };

  constructor(private poiService: PoiService) {}

  ngOnInit() {
    // Initialiser updatedPoi avec les valeurs actuelles du POI
    this.updatedPoi = {
      label: this.poi.label,
      type: this.poi.category.id, // Assurez-vous que category.id est correct
      radius: 50, // Valeur par défaut si le calcul échoue
    };

    // Calculer le radius à partir de l'area
    if (this.poi.area && this.poi.area.coordinates && this.poi.area.coordinates[0]) {
      const center = turf.point([this.poi.coordinate.coordinates[0], this.poi.coordinate.coordinates[1]]);
      const edgePointCoord = this.poi.area.coordinates[0][0]; // Premier point du polygone
      const edgePoint = turf.point(edgePointCoord);
      const distance = turf.distance(center, edgePoint, { units: 'meters' });
      this.updatedPoi.radius = distance;
    } else {
      // Si le calcul du radius échoue, utilisez une valeur par défaut
      this.updatedPoi.radius = 50;
    }
  }

  deletePOI() {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce POI ?')) {
      this.poiService.deletePOI(this.poi.id).subscribe({
        next: () => {
          alert('POI supprimé avec succès.');
          this.poiDeleted.emit(this.poi.id);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du POI:', error);
          alert('Une erreur est survenue lors de la suppression du POI.');
        },
      });
    }
  }

  submitUpdate() {
    const updatedData = {
      label: this.updatedPoi.label,
      type: this.updatedPoi.type,
      WKTPoint: `POINT(${this.poi.coordinate.coordinates[0]} ${this.poi.coordinate.coordinates[1]})`,
      radius: this.updatedPoi.radius,
    };

    this.poiService.updatePOI(this.poi.id, updatedData).subscribe({
      next: (updatedPoi) => {
        alert('POI mis à jour avec succès.');
        this.poiUpdated.emit(updatedPoi);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du POI:', error);
        alert('Une erreur est survenue lors de la mise à jour du POI.');
      },
    });
  }
}
