import { Component } from '@angular/core';
import {UserService} from "../../../services/user.service";
import {ConfigEntry, User} from "../../../type/issue";
import {ConfigService} from "../../../services/config.service";

@Component({
  selector: 'app-create-admin-user',
  templateUrl: './create-admin-user.component.html',
  styleUrl: './create-admin-user.component.css'
})
export class CreateAdminUserComponent {
  codePath:any ={};
  constructor(private userService: UserService, private configService:ConfigService) {
    configService.getCodePath().subscribe((path)=>{
      this.codePath = path;
    },error => {
      console.error("getCodePath" +error);
    });
  }

  user : User | any ={} ;

  onSubmit() {

  }

  creer() {
    alert(JSON.stringify(this.user));
    this.userService.initUser(this.user).subscribe((res: any) => {
       this.configService.onNext({});
      }, err => {
      alert(JSON.stringify(err))
      }
    )
  }
}
