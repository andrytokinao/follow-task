import {Component, OnInit} from '@angular/core';
import {NgIf} from "@angular/common";
import {Comment, Issue} from "../../../../../type/issue";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ConfigService} from "../../../../../services/config.service";
import {FormsModule} from "@angular/forms";
import {AuthService} from "../../../../../services/auth.service";

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.css'
})
export class CommentComponent implements OnInit{
  activeMenuItem: string;
  profile:any  = {};

  comment:any = {
    issue:{},
    user:{}
  };
  private parentIssue: Issue | undefined;
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService:ConfigService,
              private issueService:IssueService,
              private userService:UserService,
              private route: ActivatedRoute,
              private authService: AuthService
  ) {
  }
  comments :Comment[] = [];

  addComment() {
    this.comment.user.id = this.profile.id;// TODO: Change to user connected recuperer coté serveur
    this.comment.issue.id = this.parentIssue.id;

    this.issueService.addComment(this.comment).subscribe(res=>{
      this.comments = res;
      this.comment.text ="";
    });
  }
  loadComments(){
    console.info("--- Loading  comment ---")
    this.issueService.allComment(this.parentIssue.id).subscribe(comments =>{
        this.comments = comments;
      }
    );
  }
  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.parentIssue = data['parrentIssue'];
      this.loadComments();
    });
    this.authService.getProfile().subscribe((res)=>{
      this.profile = res;
    })
  }
}
