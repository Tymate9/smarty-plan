import { Component } from '@angular/core';
import * as L from "leaflet";

@Component({
  selector: 'app-advance-poiedit',
  template: `
    <div class="container">
      <div id="map" class="map"></div>
      <div class="form-container">
        <form>
          <div class="form-group">
            <label for="adresse">Adresse</label>
            <input type="text" id="adresse" #adresseValue name="adresse" (blur)="onAdresseBlur(adresseValue.value)">
          </div>
          <div class="form-group">
            <p>{{longitude}}/{{latitude}}</p>
          </div>
          <div class="form-group">
            <label for="label">Label : </label>
            <input type="text" id="label" name="label" (blur)="onFieldBlur('label')">
          </div>
          <div class="form-group">
            <label for="type">type</label>
            <textarea id="text" name="type" (blur)="onFieldBlur('type')"></textarea>
          </div>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      height: 100vh; /* Ajustez selon vos besoins */
    }

    .map {
      flex: 1;
      height: 100%; /* Assurez-vous que la carte prenne toute la hauteur disponible */
    }

    .form-container {
      flex: 1;
      padding: 20px;
      box-sizing: border-box;
      background-color: #f9f9f9;
    }

    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }

    input, textarea {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
    }

    button {
      padding: 10px 15px;
      font-size: 16px;
    }`
  ]
})
export class AdvancePOIEditComponent {
  private map: L.Map | undefined;

  longitude : number = 0
  latitude : number = 0

  constructor() { }

  ngOnInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map').setView([48.8566, 2.3522], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  onFieldBlur(fieldName: string): void {
    console.log(`Le champ "${fieldName}" a perdu le focus.`);
  }

  onAdresseBlur(fieldValue : string):void{
    console.log(fieldValue)
  }
}
