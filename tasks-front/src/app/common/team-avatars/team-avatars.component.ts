import {Component, Input, OnInit} from '@angular/core';
import {User} from "../../type/issue";
import {UserService} from "../../services/user.service";

@Component({
  standalone:false,
  selector: 'app-team-avatars',
  templateUrl: './team-avatars.component.html',
  styleUrl: './team-avatars.component.css'
})
export class TeamAvatarsComponent implements OnInit{
  constructor(protected userService:UserService) {
  }
  users:User[] = [];
  teamsMembers:User[] = [];
  @Input() teamsIds:String[]=[];
  teamMembersOld:any[]=[
    {name:'Toky ',imageUrl:'assets/user1.jpeg'},
    {name:'Toky ',imageUrl:'assets/user2.jpeg'},
    {name:'Toky ',imageUrl:'assets/user3.png'},
    {name:'Toky ',imageUrl:'assets/user4.jpeg'},
    {name:'Toky ',imageUrl:'assets/user5.jpeg'}
  ];

  ngOnInit(): void {
      this.userService.users$.subscribe(users => {
         if (users && this.teamsIds) {
           this.teamsMembers = users.filter(user => this.teamsIds.includes(user.id));
         } else {
           this.teamsMembers = users;
         }
        console.log(this.teamsMembers);

      });
  }


}
