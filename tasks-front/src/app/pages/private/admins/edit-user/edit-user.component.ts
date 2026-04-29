import { Component } from '@angular/core';
import { UserService } from "../../../../services/user.service";
import { MemberGroupe, User } from "../../../../type/issue";
import { environment } from "../../../../../environments/environment";
import { supprimerTypename } from "../../../../type/graphql.operations";

@Component({
  standalone: false,
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent {

  constructor(private userService: UserService) {}

  savingStatus: string = '';
  tempPhoto: string | ArrayBuffer | null = null;
  user: User | any = {};
  activeModal: any;
  action: string = "";
  memberGroupes: MemberGroupe[] = [];
  selectedPhoto: File | any = {};
  isCreate: boolean = false;

  photoUrl() {
    if (this.tempPhoto) return this.tempPhoto;
    if (this.user?.photo) {
      return environment.apiURL + 'photo/' + this.user.photo;
    }
    return 'assets/photo.png';
  }

  loadGroupeMember() {
    this.userService.loadGroupeMember(this.user.id).subscribe(
      (res: any) => {
        this.memberGroupes = supprimerTypename(res.data.loadGroupeMember);
      },
      (err) => {
        console.error("loadGroupeMember: " + err);
      }
    );
  }

  saveUser() {
    this.userService.saveUser(this.user).subscribe(
      () => {
        this.savingStatus = 'success';
        // Fermer le modal après un court délai pour que l'utilisateur voie le message
        setTimeout(() => {
          this.activeModal.close('saved');
        }, 800);
      },
      (error) => {
        this.savingStatus = 'error';
        console.error("saveUser ==> " + error);
      }
    );
  }

  selectPhoto($event: any) {
    const file: File = $event?.target.files[0];
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
    this.userService.upload(this.selectedPhoto, this.user.id).subscribe(
      () => {
        this.tempPhoto = null; // Cacher le bouton après upload
      },
      (error) => {
        console.error("uploadPhoto ==> " + error);
      }
    );
  }

  loadUser(userId: string) {
    this.userService.getUser(userId).subscribe((user: User) => {
      this.user = user;
    });
  }
}
