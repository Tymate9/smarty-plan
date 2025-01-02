import {Component, OnInit} from '@angular/core';
import {ConfigService} from "../../core/config/config.service";

@Component({
  selector: 'app-main-layout',
  template: `
    <app-navbar></app-navbar>
    <app-test-banner *ngIf="testEnv"></app-test-banner>
    <app-logo></app-logo>
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  testEnv = false;
  constructor(
    private configService: ConfigService
  ) {}
  ngOnInit() {
    this.configService.getConfig().subscribe(config => {
      this.testEnv = config.testEnv;
    });
  }
}
