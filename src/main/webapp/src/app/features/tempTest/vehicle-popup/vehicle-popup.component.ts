// src/app/components/vehicle-popup/vehicle-popup.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-vehicle-popup',
  template: `
    <div>
      <h4>{{ vehicle.serialNumber }}</h4>
      <p><strong>Conducteur:</strong> {{ vehicle.driverName }}</p>
      <p><strong>Adresse:</strong> {{ vehicle.adresse }}</p>
      <p><strong>Coordonnées:</strong> {{ vehicle.coordinate.coordinates[1] }}, {{ vehicle.coordinate.coordinates[0] }}</p>
    </div>
  `,
})
export class VehiclePopupComponent {
  @Input() vehicle: any;
}
