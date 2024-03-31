import { Component } from '@angular/core';
import {MemberGroupe, User} from "../../../type/issue";
import {UserService} from "../../../services/user.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent  {

  constructor(private userService:UserService) {
  }
  tempPhoto:string | null = null;
  editingName: boolean = true;
  user : User | any ={} ;
  activeMenuItem: string ='';
  comment: any;
  activeModal: any;
  issue: any;
  action: string ="";
  memberGroupes:MemberGroupe[] =[];
  editName() {

  }
  photoUrl(){
    if(this.tempPhoto)
      return this.tempPhoto;
    if (this.user && this.user.photo) {
      return this.user.photo;
    } else {
      return 'assets/photo.png';
    }
  }
  toggleMenu(comment: string) {

  }
  loadGroupeMember(){
    this.userService.loadGroupeMember(this.user.id).subscribe(
      (res:any)=>{
        this.memberGroupes = res.data.loadGroupeMember;
        alert(JSON.stringify(this.memberGroupes));
      },(err)=>{
        alert(JSON.stringify(err));
      }
    )
  }
  addComment() {

  }
}
