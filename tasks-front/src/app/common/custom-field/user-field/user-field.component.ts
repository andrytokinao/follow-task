import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CustomFieldValue, DisplayCustomField, User} from "../../../type/issue";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {MatFormField} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {map, Observable} from "rxjs";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../../../services/user.service";

@Component({
  selector: 'app-user-field',
  standalone: true,
  imports: [
    FormsModule,
    AsyncPipe,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatFormField,
    MatInput,
    MatOption,
    NgForOf,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './user-field.component.html',
  styleUrl: './user-field.component.css'
})
export class UserFieldComponent implements DisplayCustomField , OnInit{
  @Output() edit = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();
  @Input() isEditable = false;
  @Input() isEditing = false;
  customFieldValue: CustomFieldValue ;
  user :User;
  users:User[];
  public value:any = {};
  filteredUsers!: Observable<User[]>;
  userControl = new FormControl();
  roUser: boolean = false;


  constructor(
    private userService: UserService,
  ) {

  }
  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.edit.emit(this.customFieldValue);
    } else {
      this.customFieldValue.user = this.user
      this.save.emit(this.customFieldValue);
    }
  }
  saveValue(){
    let value:any ={
      date: '',
      string:"",
      id:this.customFieldValue.id,
      issue:this.customFieldValue.issue,
      numeric:0,
      user:this.getUser(),
      customField:this.customFieldValue.customField,
      text:''
    };
   alert(JSON.stringify(value));
    this.save.emit(value);

  }
  ngOnInit() {
    this.loadList();

  }
  setCustomFieldValue(value: CustomFieldValue) {
    this.customFieldValue = value;
    this.value = value;
    this.user = this.value.user;
  }
  loadList() {
    // TODO : Configuration des utilisateurs peut etre entrer ici
    this.userService.getUsers("projet").subscribe((users: any) => {
      this.users = users;
      this.filteredUsers = this.userControl.valueChanges.pipe(
        map(value => this._filterUsers(value || '')));
    });
  }

  private _filterUsers(value: string): User[] {
    const filterValue = value.toLowerCase();
    return this.users.filter(user => user =>
      user.firstName.toLowerCase().includes(filterValue) ||
      user.lastName.toLowerCase().includes(filterValue) ||
      user.username.toLowerCase().includes(filterValue));
  }

  onFocus() {

  }
  getUser():User{
   return  this.users.find(u=> u.username = this.userControl.value  );
  }

}
