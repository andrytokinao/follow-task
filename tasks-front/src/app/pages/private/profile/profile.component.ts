import { Component } from '@angular/core';
import {MemberGroupe, User} from "../../../type/issue";
import {UserService} from "../../../services/user.service";
import {supprimerTypename} from "../../../type/graphql.operations";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent  {

  constructor(private userService:UserService) {
  }
  savingStatus:string ='';
  tempPhoto:string | ArrayBuffer | null = null;
  editingName: boolean = true;
  user : User | any ={} ;
  activeModal: any;
  action: string ="";
  memberGroupes:MemberGroupe[] =[];
  selectedPhoto: File | any = {};
  isCreate: boolean = false;
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
  loadGroupeMember(){
    this.userService.loadGroupeMember(this.user.id).subscribe(
      (res:any)=>{
        this.memberGroupes = supprimerTypename(res.data.loadGroupeMember);
      },(err)=>{
        console.error("loadGroupeMember" +err);
      }
    )
  }

  saveUser() {
    this.userService.saveUser(this.user).subscribe(res => {
      this.savingStatus = 'success';
    }, error => {
      this.savingStatus = 'error';
      console.error("saveUser ==> " + error);
    })
  }

  selectPhoto($event: any) {
      const file: File = $event!.target.files[0];
      if (file) {
        this.selectedPhoto = file;
        this.previewImage(file);
      }
  }
  previewImage(file: File): void {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.tempPhoto = reader.result;
    };
  }
  openPhotoInput(): void {
    document.getElementById('photoInput')?.click();
  }
  uploadPhoto() {
    this.userService.upload(this.selectedPhoto,this.user.id).subscribe(res=>{
      alert(JSON.stringify(res))
    },
      error => {
      alert('ERROR' + JSON.stringify(error));
      }
      )
  }
}
