// src/app/components/poi-popup/poi-popup.component.ts
import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import { PoiService} from "../../POI/poi.service";
import * as turf from '@turf/turf';
import {dto} from "../../../../habarta/dto";


@Component({
  selector: 'app-poi-popup',
  template: `
    <div>
      <h4>Modifier le POI</h4>
      <h4>Adresse : {{ address }}</h4>
      <form (ngSubmit)="submitUpdate()">
        <label for="label">Nom :</label>
        <input type="text" id="label" [(ngModel)]="updatedPoi.label" name="label"><br>

        <label for="category">Type :</label>
        <select id="category" [(ngModel)]="selectedCategoryId" name="category">
          <option *ngFor="let category of categories" [value]="category.id">
            {{ category.label }}
          </option>
        </select><br>

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

  address: string = 'Chargement...';
  updatedPoi: { label: string; radius: number };
  categories: dto.PointOfInterestCategoryEntity[] = [];

  selectedCategoryId: number | null = null;

  constructor(private poiService: PoiService) {}

  ngOnInit() {
    this.poiService.getAddressFromCoordinates(this.poi.coordinate.coordinates[1],this.poi.coordinate.coordinates[0]).subscribe({
      next: (response) => {
        this.address = response.adresse; // Assurez-vous que 'address' est la bonne clé
      },
      error: () => this.address = 'Adresse non disponible',
    });
    // Initialiser updatedPoi avec les valeurs actuelles du POI
    this.updatedPoi = {
      label: this.poi.label,
      radius: 50, // Valeur par défaut si le calcul échoue
    };

    // Calculer le radius à partir de l'area
    if (this.poi.area && this.poi.area.coordinates && this.poi.area.coordinates[0]) {
      const center = turf.point([this.poi.coordinate.coordinates[0], this.poi.coordinate.coordinates[1]]);
      const edgePointCoord = this.poi.area.coordinates[0][0]; // Premier point du polygone
      const edgePoint = turf.point(edgePointCoord);
      const distance = turf.distance(center, edgePoint, { units: 'meters' });
      this.updatedPoi.radius = Math.round(distance);
    } else {
      // Si le calcul du radius échoue, utilisez une valeur par défaut
      this.updatedPoi.radius = 50;
    }

    // Récupérer les catégories
    this.poiService.getAllPOICategory().subscribe({
      next: (categories) => {
        this.categories = categories;

        // Initialiser selectedCategoryId avec l'ID de la catégorie actuelle du POI
        this.selectedCategoryId = this.poi.category.id;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des catégories:', error);
      }
    });
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
    if (this.selectedCategoryId === null) {
      alert('Veuillez sélectionner une catégorie pour le POI.');
      return;
    }

    const updatedData = {
      label: this.updatedPoi.label,
      type: this.selectedCategoryId,
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
