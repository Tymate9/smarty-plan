import { Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <div class="logo-container">
      <img src="assets/logo-nm.png" alt="Logo" />
    </div>
  `,
  styles: [
    `
      .logo-container {
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 1000;
        width: 100px;
        height: 50px;
        overflow: hidden;
        pointer-events: none;
      }

      .logo-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.8;
        transition: opacity 0.3s;
      }

      .logo-container img:hover {
        opacity: 1;
      }
    `,
  ],
})
export class LogoComponent {}
