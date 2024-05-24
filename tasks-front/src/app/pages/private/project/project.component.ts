import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Route} from "@angular/router";

@Component({
  selector: 'app-project',
  standalone: false,
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit{
  private bankName: string ="";
  constructor(private route:ActivatedRoute) {
  }

  ngOnInit(): void {
      this.route.params.subscribe( params => {
        alert(params["project"]);
      });
  }
}
