import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../../services/auth.service";
import {nextMonthDisabled} from "@ng-bootstrap/ng-bootstrap/datepicker/datepicker-tools";
import {tap} from "rxjs";
import {LocalStorageService} from "../../../services/local-storage.service";
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string='0325698745';
  password: string='123';
  signupMode :boolean=false;
  constructor(private router: Router, private loginService: AuthService, private localStorage: LocalStorageService) {

  }
  login() {
    this.loginService.login(this.username, this.password).pipe().subscribe(
      (res:any)=>{
        if(res.error.text === 'success') {
          this.router.navigate(['/private']);
        }
      },(res2:any) => {
        if(res2.error.text === 'success') {
          this.router.navigate(['/private']);
        }
      }
    )
  }

  signup() : void{
   this.signupMode = !this.signupMode;
  }
}
