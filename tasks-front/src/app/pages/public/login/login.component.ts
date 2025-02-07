import {Component, inject} from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../../services/auth.service";
import {nextMonthDisabled} from "@ng-bootstrap/ng-bootstrap/datepicker/datepicker-tools";
import {map, Observable, tap} from "rxjs";
import {LocalStorageService} from "../../../services/local-storage.service";
import {ConfigService} from "../../../services/config.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateAdminUserComponent} from "../create-admin-user/create-admin-user.component";
import {ToastrService} from "ngx-toastr";
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder, FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {EventGateway} from "../../../type/event-gatway";
import {isAdultValidator, PasswordMatchValidator} from "../../../type/validator";
import {User} from "../../../type/issue";
import {UserService} from "../../../services/user.service";
import {EditEventComponent} from "../../../common/edit-event/edit-event.component";
export type Nullable<T> = T | null;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string='';
  password: string='';
  signupMode :boolean=false;
  newUser: any;
  newContact: any;
  newUsername: any;
  newPassword: String ="";
  confirmPassword: String ="";
  constructor(private router: Router,
              private loginService: AuthService,
              private localStorage: LocalStorageService,
              private authService:AuthService,
              private configService:ConfigService,
              private modalService: NgbModal,
              private toast : ToastrService,
              private userService : UserService
  ) {
    this.authService.getProfile().subscribe(profile=>{
      this.router.navigate(['/working']);
    });
    this.configService.nextIntallation().subscribe(path=>{
      if(path == "create-admin-user") {
        let dialogRef: any;
        const modalRef = this.modalService.open(CreateAdminUserComponent, {
          size: 'lg',
          backdrop: 'static',
          keyboard: false
        });
     }

    })
  }
  login() {
    this.loginService.login(this.username, this.password).pipe().subscribe(
      (res:any)=>{
        if (res == 'success') {
          this.connectionSuccess();
        }
        if (res == 'failed') {
          this.connectionFiled();
        }
      },(res2:any) => {
        if(res2 == 'success') {
          this.connectionSuccess();
        }
        if (res2 == 'failed') {
          this.connectionFiled();
        }
      }
    )
  }
  connectionFiled(){
    this.toast.error("login ou mot de passe incorrecte","login falled");
  }
  connectionSuccess(){
    this.toast.success("Connection success","Successful");
    this.router.navigate(['/working/']);

  }
  signup() : void{
   this.signupMode = !this.signupMode;
  }
  eventGateway = inject(EventGateway);
  private isValidContact():ValidatorFn{
    return (group: AbstractControl): Nullable<ValidationErrors> => {
      if( this.form == null || this.form.value == null) {
        return {notReady:true}
      }
      if (this.form.value.contact) {
        return {notConfirmed:true}
      }
      return null;
    }
  }

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
  contact: String ;

  onSubmit() {
    console.log(this.form);
    this.form.markAllAsTouched();
    if (!this.form.valid) return;
    this.toast.info(" ...","Sig up");
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
  private passwordConfirmation(): ValidatorFn {
    return (group: AbstractControl): Nullable<ValidationErrors> => {
      const {adultTicketCount, childTicketCount} = group.value;
      const hasChildTicketOnly = !adultTicketCount && this.isConfirmed;
      return hasChildTicketOnly ? { childTicketOnly: true } : null;
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
    this.userService.saveUser(user).subscribe(user => {
      this.toast.success("Resister successful","Successful");
       this.signup() ;
      }, error =>  {
      this.toast.error("Sign up error :"+error.message,"Sign up error");

    })

  }
}
