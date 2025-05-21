import {Component, Input, Output, OnChanges, SimpleChanges, EventEmitter} from '@angular/core';
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

  @Output() anglesSaved = new EventEmitter<DeviceAccelAnglesDTO>()

  projections = ['XY', 'XZ', 'YZ'];
  proj: string = this.projections[0];

  granularities = [1, 2, 4, 5, 10];
  granularity = this.granularities[4];
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
      this.accelerationService.computeGGDiagram(this.period!!.deviceId, this.period!!.beginDate, this.proj, this.phi, this.theta, this.psi, this.granularity).subscribe({
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
    if (this.period) {
      this.accelerationService.saveAngles(this.period!!.deviceId, this.period!!.beginDate, this.phi, this.theta, this.psi).subscribe({
        next: (dto) => {
          this.anglesSaved.emit(dto)
        },
        error: (err) => {
          console.error('Erreur a la sauvegarde des angles', err);
        }
      })
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    let periodChanged = changes["period"].currentValue
    if (periodChanged) {
      this.proj = this.projections[0];
      this.phi = periodChanged.phi || 0;
      this.theta = periodChanged.theta || 0;
      this.psi = periodChanged.psi || 0;
      this.displayGgDiagram();
    }
  }
}
