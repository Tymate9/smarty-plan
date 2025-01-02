import {Component} from "@angular/core";

@Component({
  selector: 'app-test-banner',
  template: `
    <div class="banner-container">
      ENVIRONNEMENT DE TEST
    </div>
  `,
  styles: [
    `.banner-container {
      margin: 3rem;
      position: absolute;
      pointer-events: none;
      top: 0;
      left: 0;
      // bottom: 0;
      z-index: 20000;
      color: rgba(255, 0, 0, 0.2);
      right: 0;
      align-content: center;
      text-align: center;
      font-size: 5em;

      p {
        margin-left: auto;
        margin-right: auto;
      }
    }
    `,
  ],
})
export class TestBannerComponent {}
