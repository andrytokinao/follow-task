import { Component } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email: string='';
  password: string='';
  signupMode :boolean=false;
  constructor(private router: Router) { }

  login() {
    this.router.navigate(['private/admin/users']);
  }

  show() {

  }
  signup() : void{
   this.signupMode = !this.signupMode;
  }
}
