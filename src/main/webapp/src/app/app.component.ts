import {Component, OnInit} from '@angular/core';
import {Toast} from "primeng/toast";
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    Toast,
    RouterOutlet
  ],
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'webapp';

  constructor() {}
}
