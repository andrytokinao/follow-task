import { Component } from '@angular/core';
import {ConfigService} from "../../services/config.service";
import {Router, RouterModule} from "@angular/router";

@Component({
  selector: 'app-installation',
  templateUrl: './installation.component.html',
  styleUrl: './installation.component.css'
})
export class InstallationComponent {
  show:boolean = true;
   constructor(
     private configService:ConfigService,
     private router:Router
   ) {
     this.configService.nextIntallation().subscribe(path=>{
       if (path == 'completed') {
         this.show = false;
       }
     })
   }

  nextInstall() {
    this.configService.nextIntallation().subscribe(nextPath => {
      const [path, queryString] = nextPath.split('?');
      const params = this.getParamsFromQueryString(queryString);
      this.router.navigate([path], { queryParams: params });
    });
  }
  private getParamsFromQueryString(queryString: string): any {
    if (!queryString) {
      return {};
    }
    return queryString.split('&').reduce((params: any, param) => {
      const [key, value] = param.split('=');
      params[key] = decodeURIComponent(value);
      return params;
    }, {});
  }
}
