import {Component, Input, OnInit} from '@angular/core';
import {DocumentApp, User} from "../../type/issue";
import {UserService} from "../../services/user.service";
import {AuthService} from "../../services/auth.service";
import {Observable} from "rxjs";
import {ProjectGuard} from "../../services/ProjectGuard";
import {IssueService} from "../../services/issue.service";

@Component({
  selector: 'app-document-menu',
  standalone:false,
  templateUrl: './document-menu.component.html',
  styleUrl: './document-menu.component.css'
})
export class DocumentMenuComponent implements OnInit{
    @Input() document:DocumentApp;
  protected connected: User;
  connected$: Observable<User>;
  adminPermission$: Observable<boolean>;
   constructor(
     protected autService:AuthService,
     protected projectGuard:ProjectGuard,
     private issueService:IssueService
   ) {
     this.connected$ = this.autService.connectedUser$;
     this.adminPermission$ = this.projectGuard.hasCredential(['ADMIN']);
     this.connected$.subscribe(co => {
       this.connected = co;
     })
   }

  ngOnInit(): void {}
  isProprietaire(connected: User): boolean {
    return connected?.id === this.document.userApp?.id;
  }
  deleteDocument(){
     this.issueService.deleteDocumentById(this.document.id).subscribe( data => {
       alert("Deleted ok ");
     })
  }
}
