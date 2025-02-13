import {Component, EventEmitter, Input, Output} from '@angular/core';
import {KeyValuePipe, NgForOf, NgStyle, SlicePipe} from "@angular/common";
import {Button} from "primeng/button";

@Component({
  selector: 'app-indicator-buttons',
  template: `
    <div class="indicator-buttons">
      <p-button
        *ngFor="let stat of (statsMap | keyvalue | slice:sliceRange[0]:sliceRange[1])"

        [ngStyle]="{ '--button-color': buttonColor }"
        class="custom-indicator-button"
        (click)="onFilterByKey(stat.key)">
    <span>
      <span class="indicator-count">{{ stat.value }}</span>
      <span class="indicator-text">{{ keyLabels[stat.key] }}</span>
    </span>
      </p-button>
    </div>
  `,

  styles: [`
    /*Style de bouton Indicateur*/
    .indicator-buttons {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      margin-top: 20px;
      justify-content: center;
      align-items: center;
    }

    .custom-indicator-button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30px;
      font-size: 10px;
      font-weight: bold;
      border: none;
      width: 100%;
      flex: 1 1 170px;
      height: 90px;
      box-sizing: border-box;
      position: relative;
      border-radius: 20px;
      color: #333;
      background: white;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
      white-space: nowrap;
      box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.2);

    }

    .custom-indicator-button i {
      margin-right: auto;
      font-size: 30px;
      color: var(--button-color, #007bff);
      margin-left: auto;

    }

    .custom-indicator-button:hover {
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    .custom-indicator-button::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 30%;
      background: var(--button-color, #007bff);
      border-top-left-radius: 20px;
      border-bottom-left-radius: 20px;
    }

    .custom-indicator-button span {
      position: relative;
      //z-index: 3;
      display: flex;
      flex: 1;
      justify-content: space-between;
      padding-left: 13px;
    }

    .custom-indicator-button .status-count {
      color: black !Important;
      padding: 0 5px !Important;
      font-weight: bold !Important;
      margin-right: 10px !Important;
    }

    .custom-indicator-button .status-text {
      color: var(--button-color, #007bff);
    }

    /*fin de Style de bouton Indicateur*/

  `],
  imports: [
    NgStyle,
    NgForOf,
    Button,
    KeyValuePipe,
    SlicePipe
  ],
  standalone: true
})
export class IndicatorButtonsComponent {
  @Input() statsMap: { [key: string]: number } = {};
  @Input() keyLabels: { [key: string]: string } = {};
  @Input() buttonColor: string = 'var(--gray-300)';
  @Input() sliceRange: number[] = [0, 5];
  @Input() keyToPropertyMap: { [key: string]: string } = {};

  @Output() filterClicked = new EventEmitter<string>();

  onFilterByKey(key: string) {
    // if (['totalHasLastTripLong', 'totalHasLateStartSum', 'totalHasLateStop'].includes(key)) {
    //   console.log(`Filtering by key: ${key}`);
    //   // Implement filtering logic or emit an event
    // }
    if (this.keyToPropertyMap[key]) {
      console.log(`Filtering by key: ${key}`);
      this.filterClicked.emit(key);
    }
  }
}
