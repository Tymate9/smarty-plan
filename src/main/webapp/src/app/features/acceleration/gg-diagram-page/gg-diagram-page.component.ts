import {Component} from '@angular/core';
import {GgDiagramComponent} from "../gg-diagram/gg-diagram.component";
import {Button} from "primeng/button";
import {FormsModule} from "@angular/forms";
import {AccelerationService} from "../acceleration.service";
import {dto} from "../../../../habarta/dto";
import GGDiagramDTO = dto.GGDiagramDTO;

@Component({
  selector: 'gg-diagram-page',
  imports: [GgDiagramComponent, Button, FormsModule],
  templateUrl: './gg-diagram-page.component.html',
  standalone: true,
  styleUrl: './gg-diagram-page.component.scss'
})
export class GgDiagramPageComponent {

  deviceId: number;
  beginDate: string;
  endDate: string;

  ggDiagram: GGDiagramDTO[]

  constructor(
    private accelerationService: AccelerationService
  ) {
  }

  displayGgDiagram() {
    this.accelerationService.computeGGDiagram(this.deviceId,this.beginDate,this.endDate).subscribe({
      next: (ggDiagram) => {
        console.log(ggDiagram);
        this.ggDiagram = ggDiagram
      },
      error: (err) => {
        console.error('Erreur chargement gg-diagram', err);
      }
    })
  }
}
