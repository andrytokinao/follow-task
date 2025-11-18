import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatAutocomplete} from "@angular/material/autocomplete";
import {MatFormField} from "@angular/material/form-field";
import {map, Observable} from "rxjs";
import {UserService} from "../../services/user.service";
import {FormControl} from "@angular/forms";
import {ActionItem, CustomFieldValue, Issue, User} from "../../type/issue";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../services/issue.service";
import {ActivatedRoute} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {AuthGuard} from "../../services/SystemGuard";
import {AuthService} from "../../services/auth.service";
import {ProjectGuard} from "../../services/ProjectGuard";

@Component({
  standalone: false,
  selector: 'app-assign-field',
  templateUrl: './assign-field.component.html',
  styleUrl: './assign-field.component.css'
})
export class AssignFieldComponent implements OnInit{
  roUser: boolean;
  userControl: FormControl;
  isEditing: any;
  user :User;
  users:User[];
  filteredUsers!: Observable<User[]>;
  @Input() issue: Issue;
  @Output() save = new EventEmitter<Issue>();

  constructor(
    private modalService: NgbModal,
    protected issueService: IssueService,
    public userService: UserService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    protected authGuard:AuthGuard,
    private authService: AuthService,
    protected projectGuard:ProjectGuard


  ) {

  }
  ngOnInit() {
      // TODO : Configuration des utilisateurs peut etre entrer ici
      this.userService.allMembers$.subscribe((users: any) => {
        this.users = users;
      });
  }

  private _filterUsers(value: string): User[] {
    const filterValue = value.toLowerCase();
    return this.users.filter(user => user =>
      user.firstName.toLowerCase().includes(filterValue) ||
      user.lastName.toLowerCase().includes(filterValue) ||
      user.username.toLowerCase().includes(filterValue));
  }
  assigneToUserOld(user: User) {
    if (this.issue != null) {
      this.issueService.assigneToUser(this.issue,user).subscribe((issue:Issue)=>{
          this.issue = issue;
          this.save.emit(this.issue);
        }
      )
    }
  }
  assigneToUser(user: User) {
    if (this.issue != null) {
      this.issueService.createActionAssign(this.issue,user).subscribe( res => {
        this.issueService.getIssueById(this.issue.id).subscribe(issue => this.issue = issue);
      });
    }
  }
  isActive(user: User): boolean {
    if (this.issue != null && this.issue.assigne != null) {
      return this.issue.assigne.id == user.id;
    }
    return false;
  }

  assign(issue: Issue) {

  }
}
