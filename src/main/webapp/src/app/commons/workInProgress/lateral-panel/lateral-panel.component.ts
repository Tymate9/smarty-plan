import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-lateral-panel',
  template: `
    <div class="lateral-panel-container">
      <button (click)="logMessage()">Afficher le message</button>
    </div>
  `,
  standalone: true,
  styles: [`
    .lateral-panel-container {
      padding: 8px;
      border: 1px solid #ccc;
      background-color: #f9f9f9;
    }
  `]
})
export class LateralPanelComponent {
  @Input() panelMessage: string = '';

  logMessage(): void {
    console.log(this.panelMessage);
  }
}
