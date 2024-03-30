import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {LocalStorageService} from "../../services/local-storage.service";

@Component({
  selector: 'private-root',
  templateUrl: './private.component.html',
  styleUrl: './private.component.css'
})
export class PrivateComponent {
  profile:any  = {};
  title = 'tasks-front';
  constructor(private router: Router, private authService: AuthService, private localStorage: LocalStorageService) {
    this.authService.getProfile().subscribe(profile=>{
      this.profile = profile;
    })
  }
  logout(){
    this.authService.logout().subscribe(
      res => {
        this.router.navigate(["/login"]);
      },error => {
        this.router.navigate(["/login"]);
      }
    );
  }
}
