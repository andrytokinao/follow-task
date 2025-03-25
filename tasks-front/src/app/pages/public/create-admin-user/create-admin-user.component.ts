import {Component, inject} from '@angular/core';
import {UserService} from "../../../services/user.service";
import {ConfigEntry, User} from "../../../type/issue";
import {ConfigService} from "../../../services/config.service";
import {Router} from "@angular/router";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {
  AbstractControl, AsyncValidatorFn,
  FormControl,
  FormControlOptions,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {Nullable} from "../login/login.component";
import {map, Observable} from "rxjs";
import {EventGateway} from "../../../type/event-gatway";

@Component({
  standalone:false,
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
  eventGateway = inject(EventGateway);
  newPassword: String ="";
  confirmPassword: String ="";
  contact: String ="";
  codeValidation: String="";

  private contactValidator(): ValidatorFn {

    return (group: AbstractControl): Nullable<ValidationErrors> => {
      const contactPattern = /^(0(34|33|32|38)|\+261(34|33|32|38))\d{7}$/;

      if( this.form == null || this.form.value == null) {
        return {notReady:true}
      }
      const isValid = contactPattern.test(this.form.value.contact);
      if (!isValid) {
        return {invalidContact:true}
      }
      return null;
    }
  }
  form = new FormGroup({
    codeValidation: new FormControl ("",Validators.required),
    username: new FormControl ("",Validators.required),
    firstname: new FormControl('', [Validators.required]),
    lastname: new FormControl('', [Validators.required]),
    contact: new FormControl<Nullable<string>>(null, [Validators.required, this.contactValidator]),
    email: new FormControl('', [Validators.email]),
    password: new FormControl<Nullable<string>>(null,[Validators.required]),
    confirmPassword: new FormControl<Nullable<string>>(null,[Validators.required,this.isConfirmed]),
  }, {
    validators: [this.isConfirmed(),this.contactValidator()],
    asyncValidators: [this.remainsSeats()],
    updateOn: 'blur'
  });


  onSubmit() {
    console.log(this.form);
    this.form.markAllAsTouched();
    if (!this.form.valid) return;
    this.register();

  }

  private isConfirmed(): ValidatorFn {
    return (group: AbstractControl): Nullable<ValidationErrors> => {
      if( this.form == null || this.form.value == null) {
        return {notReady:true}
      }
      if (this.form.value.password != this.form.value.confirmPassword) {
        return {notConfirmed:true}
      }
      return null;
    }
  }
  private remainsSeats(): AsyncValidatorFn {
    return (group: AbstractControl): Observable<Nullable<ValidationErrors>> => {
      const {adultTicketCount, childTicketCount} = group.value;
      const totalSeatsCount = (adultTicketCount || 0) + (childTicketCount || 0);
      return this.eventGateway.retrieveRemainingSeats().pipe(
        map(({ remainingSeats }) => remainingSeats >= totalSeatsCount ? null : { remainingSeats  })
      );
    }
  }
  register(){
    let user:User | any = {}
    user.username = this.form.value.username;
    user.contact = this.form.value.contact;
    user.firstName = this.form.value.firstname;
    user.lastName = this.form.value.lastname;
    user.email = this.form.value.email;
    user.password = this.form.value.password;
    user.codeValidation = this.form.value.codeValidation;
    this.error = undefined;
    this.userService.initUser(user).subscribe((res: any) => {
        this.activeModal.close();
      },
      err => {
        this.error = err.message;
        console.error(err);
      }
    )

  }
}
