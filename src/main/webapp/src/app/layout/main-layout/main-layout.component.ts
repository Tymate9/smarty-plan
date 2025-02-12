import {Component, OnInit} from '@angular/core';
import {ConfigService} from "../../core/config/config.service";
import {NavbarComponent} from "../../commons/navbar/navbar.component";
import {RouterOutlet} from "@angular/router";
import {TestBannerComponent} from "../../commons/testBanner/testBanner.component";
import {CommonModule, NgIf} from "@angular/common";

@Component({
  selector: 'app-main-layout',
  template: `
    <app-navbar></app-navbar>
    <app-test-banner *ngIf="testEnv"></app-test-banner>
    <router-outlet></router-outlet>
  `,
  standalone: true,
  imports: [
    NavbarComponent,
    RouterOutlet,
    TestBannerComponent,
    NgIf,
    CommonModule
  ],
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
