import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {routeTransition} from "../route-transition";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    routeTransition
  ]
})
export class AppComponent {
  title = 'tasks-front';
  pageContent: string = "";
  content: string ="ontenu";
}
