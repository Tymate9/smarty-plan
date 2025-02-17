import {Component, EventEmitter, Input, Output} from '@angular/core';
import {KeyValuePipe, NgForOf, NgStyle, SlicePipe} from "@angular/common";
import {Button} from "primeng/button";

@Component({
  selector: 'app-indicator-buttons',
  template: `
    <div class="indicator-buttons">
      <button
        *ngFor="let stat of (statsMap | keyvalue | slice:sliceRange[0]:sliceRange[1])"

        [ngStyle]="{ '--button-color': buttonColor }"
        class="custom-indicator-button"
        (click)="onFilterByKey(stat.key)">
    <span>
      <span class="indicator-count">{{ stat.value }}</span>
      <span class="indicator-text">{{ keyLabels[stat.key] }}</span>
    </span>
      </button>
    </div>
  `,

  styleUrls: ['../../../styles/custom-indicator-button.scss'],
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
