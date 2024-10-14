import { Component } from '@angular/core';
import {HelloWorldComponent} from "./features/hello-world/hello-world.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'webapp';
}
