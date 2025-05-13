import {Component, OnInit} from '@angular/core';
import {dto} from "../../../../habarta/dto";
import DeviceAccelAnglesDTO = dto.DeviceAccelAnglesDTO;
import VehicleAccelPeriodsDTO = dto.VehicleAccelPeriodsDTO;
import {AccelerationService} from "../acceleration.service";
import { TableModule } from 'primeng/table';
import {NgIf} from "@angular/common";
import {DATE_FORMATTER} from "../../../core/date-formatter"
import {GgDiagramCalibrationComponent} from "../gg-diagram-calibration/gg-diagram-calibration.component";


@Component({
  selector: 'app-list-vehicle-page',
  imports: [TableModule, NgIf, GgDiagramCalibrationComponent],
  templateUrl: './list-vehicle-page.component.html',
  standalone: true,
  styleUrl: './list-vehicle-page.component.scss'
})
export class ListVehiclePageComponent implements OnInit{

  vehicleAccelPeriods: VehicleAccelPeriodsDTO[];

  vehicleSelected: VehicleAccelPeriodsDTO[] = [];

  periodToDisplay?: DeviceAccelAnglesDTO;
  entityToDisplay?: VehicleAccelPeriodsDTO;

  readonly dateFormatter = DATE_FORMATTER

  constructor(
    private accelerationService: AccelerationService
  ) {}

  ngOnInit(): void {
    this.accelerationService.listCalibrationPeriods().subscribe({
      next: (vehicleAccelPeriods) => {
        this.vehicleAccelPeriods = vehicleAccelPeriods;
      },
      error: (err) => {
        console.error('Error loading list vehicle accel periods', err);
      }
    })
  }

  selectVehicle(entity: VehicleAccelPeriodsDTO) {
    let indexEntity = this.vehicleSelected.indexOf(entity);
    if (indexEntity != -1) {
      this.vehicleSelected.splice(indexEntity, 1);
    } else {
      this.vehicleSelected.push(entity);
    }
  }

  selectPeriod(period: DeviceAccelAnglesDTO, entity: VehicleAccelPeriodsDTO) {
    this.periodToDisplay = period;
    this.entityToDisplay = entity;
  }

  callbackOnSavedAngles(period: DeviceAccelAnglesDTO) {
    if (this.periodToDisplay) {
      let indexPeriodToChange = this.entityToDisplay?.periods.indexOf(this.periodToDisplay)
      console.log(indexPeriodToChange)
      if (indexPeriodToChange != null && indexPeriodToChange !=-1) {
        this.entityToDisplay!!.periods[indexPeriodToChange] = period
      }
      this.periodToDisplay = period
    }
  }
}
