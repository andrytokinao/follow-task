import {Component, inject, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../../services/auth.service";
import {map, Observable, tap} from "rxjs";
import {LocalStorageService} from "../../../services/local-storage.service";
import {ConfigService} from "../../../services/config.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CreateAdminUserComponent} from "../create-admin-user/create-admin-user.component";
import {ToastrService} from "ngx-toastr";
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {EventGateway} from "../../../type/event-gatway";
import {User} from "../../../type/issue";
import {UserService} from "../../../services/user.service";

export type Nullable<T> = T | null;

@Component({
  standalone:false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{
  username: string='';
  password: string='';
  signupMode :boolean=false;
  newUser: any;
  newContact: any;
  newUsername: any;
  newPassword: String ="";
  confirmPassword: String ="";
  loginInProgress = false;
  loginMessage?: string;
  loginErrorMessage?: string;
  constructor(private router: Router,
              private loginService: AuthService,
              private localStorage: LocalStorageService,
              private authService:AuthService,
              private configService:ConfigService,
              private modalService: NgbModal,
              private toast : ToastrService,
              private userService : UserService
  ) {
  }
  login(): void {
    if (this.loginInProgress) return;
    this.loginInProgress = true;
    this.loginMessage = undefined;
    this.loginErrorMessage = undefined;

    this.loginService.login(this.username, this.password).subscribe({
      next: () => {
        this.toast.success('Connexion réussie !', 'Succès');
        this.onLoginSuccess(this.username);
      },
      error: (error: any) => {
        this.username = undefined;
        this.password = '';
        this.onLoginFailure();
      },
      complete: () => {
        this.loginInProgress = false;
      }
    });

  }

  private onLoginFailure(): void {
    this.loginErrorMessage = 'Nom d’utilisateur ou mot de passe incorrect.';
    this.loginMessage = undefined;
    this.loginInProgress = false;
  }

  private onLoginSuccess(username:String): void {
    this.authService.getProfile(true).subscribe();
    this.loginMessage = 'Connexion réussie ! Redirection en cours...';
    this.loginErrorMessage = undefined;
    this.loginInProgress = false;
    this.authService.loadProfile();
    this.authService.loadConnectedUserByUsername(username);
  }
  // Bascule explicite entre les deux onglets. Chaque méthode ferme aussi
  // l'écran "mot de passe oublié", qui est un troisième état indépendant.
  showSignIn(): void {
    this.signupMode = false;
    this.forgotPasword = false;
  }

  showSignUp(): void {
    this.signupMode = true;
    this.forgotPasword = false;
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
  forgotPasword: boolean = false;

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
       this.showSignIn() ;
      }, error =>  {
      this.toast.error("Sign up error :"+error.message,"Sign up error");
    })

  }

  forgotResult($result: any) {
    this.forgotPasword = false;
  }

  ngOnInit(): void {

    this.authService.getProfile().subscribe(profile=>{
      if (profile) {
        this.authService.redirigerApresConnexion();
      }
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
}
