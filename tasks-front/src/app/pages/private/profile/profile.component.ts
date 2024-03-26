import { Component } from '@angular/core';
import {User} from "../../../type/issue";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent  {
  editingName: boolean = true;
  user : User | null = null;
  activeMenuItem: string ='';
  comment: any;
  activeModal: any;
  issue: any;

  editName() {

  }

  toggleMenu(comment: string) {

  }

  addComment() {

  }
}
