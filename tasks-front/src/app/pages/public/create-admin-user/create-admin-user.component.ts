import {Component} from '@angular/core';
import {UserService} from "../../../services/user.service";
import {ConfigEntry, User} from "../../../type/issue";
import {ConfigService} from "../../../services/config.service";
import {Router} from "@angular/router";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-create-admin-user',
  templateUrl: './create-admin-user.component.html',
  styleUrl: './create-admin-user.component.css'
})
export class CreateAdminUserComponent {
  codePath: any = {};
  error:String = undefined;
  constructor(private userService: UserService,
              private configService: ConfigService,
              private router: Router,
              private activeModal:NgbActiveModal
  ) {
    configService.getCodePath().subscribe((path) => {
      this.codePath = path;
    }, error => {
      console.error("getCodePath" + error);
    });
  }

  user: User | any = {};

  onSubmit() {

  }

  creer() {
    this.error = undefined;
    this.userService.initUser(this.user).subscribe((res: any) => {
        this.configService.onNext(data => {
          this.router.navigate(['/public/login']);
          this.activeModal.close();
        });
      },
      err => {
        this.error = err.message;
        console.error(err);
      }
    )
  }
}
