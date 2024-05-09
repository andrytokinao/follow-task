import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../../services/auth.service";
import {nextMonthDisabled} from "@ng-bootstrap/ng-bootstrap/datepicker/datepicker-tools";
import {tap} from "rxjs";
import {LocalStorageService} from "../../../services/local-storage.service";
import {ConfigService} from "../../../services/config.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateAdminUserComponent} from "../create-admin-user/create-admin-user.component";
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string='0341981972';
  password: string='123';
  signupMode :boolean=false;
  constructor(private router: Router,
              private loginService: AuthService,
              private localStorage: LocalStorageService,
              private authService:AuthService,
              private configService:ConfigService,
              private modalService: NgbModal,
  ) {
    this.authService.getProfile().subscribe(profile=>{
      this.router.navigate(["private/"])
    });
    this.configService.nextIntallation().subscribe(path=>{

      if(path == "create-admin-user") {
        let dialogRef: any;
         dialogRef = this.modalService.open(CreateAdminUserComponent, {windowClass: "xlModal"});
     }

    })
  }
  login() {
    this.loginService.login(this.username, this.password).pipe().subscribe(
      (res:any)=>{
        if(res == 'success') {
          this.router.navigate(['/private']);
        }
      },(res2:any) => {
        if(res2 == 'success') {
          this.router.navigate(['/private']);
        }
      }
    )
  }

  signup() : void{
   this.signupMode = !this.signupMode;
  }
}
