import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {GgDiagramComponent} from "../gg-diagram/gg-diagram.component";
import {Button} from "primeng/button";
import {FormsModule} from "@angular/forms";
import {AccelerationService} from "../acceleration.service";
import {dto} from "../../../../habarta/dto";
import GGDiagramDTO = dto.GGDiagramDTO;
import DeviceAccelAnglesDTO = dto.DeviceAccelAnglesDTO;
import VehicleDTO = dto.VehicleDTO;
import {DATE_FORMATTER} from "../../../core/date-formatter";
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'gg-diagram-calibration',
  imports: [GgDiagramComponent, Button, FormsModule, SelectModule],
  templateUrl: './gg-diagram-calibration.component.html',
  standalone: true,
  styleUrl: './gg-diagram-calibration.component.scss'
})
export class GgDiagramCalibrationComponent implements OnChanges{

  @Input()
  vehicle?: VehicleDTO;
  @Input()
  period?: DeviceAccelAnglesDTO;

  projections = ['XY', 'XZ', 'YZ']
  proj: string = this.projections[0];

  //deviceId: number = 161;
  //beginDate: string = "2025-01-01T00:00:00";
  //endDate: string = "2025-05-05T00:00:00";
  phi: number = 0;
  theta: number = 0;
  psi: number = 0;

  ggDiagram: GGDiagramDTO[]

  readonly dateFormatter = DATE_FORMATTER

  constructor(
    private accelerationService: AccelerationService
  ) {}

  displayGgDiagram() {
    if (this.period){
      this.accelerationService.computeGGDiagram(this.period!!.deviceId, this.period!!.beginDate, this.proj, this.phi, this.theta, this.psi).subscribe({
        next: (ggDiagram) => {
          this.ggDiagram = ggDiagram;
        },
        error: (err) => {
          console.error('Erreur chargement gg-diagram', err);
        }
      })
    } else this.ggDiagram = [];
  }

  saveAngles() {

  }

  ngOnChanges(changes: SimpleChanges): void {
    this.proj = this.projections[0];
    this.phi = changes["period"].currentValue.phi || 0;
    this.theta = changes["period"].currentValue.theta || 0;
    this.psi = changes["period"].currentValue.psi || 0;
    this.displayGgDiagram();
  }
}
