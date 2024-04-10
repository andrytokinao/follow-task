import {Component, OnInit} from '@angular/core';

import {Router} from "@angular/router";
import {ConfigService} from "../../services/config.service";

@Component({
  selector: 'app-installation',
  templateUrl: './installation.component.html',
  styleUrl: './installation.component.css'
})
export class InstallationComponent implements OnInit{
  step:string[] = ['installation/create-user-admin','installation/work-space','installation/media-space','installation/first-project']
  index:number = 0;
  path:String = "";
  constructor(private router: Router, private configService:ConfigService) {
    configService.initConfig();
  }

  previous() {
    if (this.index  > 0 ) {
      this.index -- ;
      this.router.navigateByUrl(this.step[this.index]);
    }
  }

  next() {
    if (this.index  < this.step.length -1) {
      this.index ++ ;
      this.router.navigateByUrl(this.step[this.index]);
    }
  }

  ngOnInit(): void {
    let currentUrl:string | undefined = this.router.getCurrentNavigation()?.finalUrl?.toString();
    if(currentUrl) {
      this.index = this.step.indexOf(currentUrl.substring(1,currentUrl.length));
    }
    this.configService.nextEvent.subscribe((res)=>{
      this.next();
    });
  }
}
