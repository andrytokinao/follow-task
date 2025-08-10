import {Component, EventEmitter, Output} from '@angular/core';
import {MatRadioGroup} from "@angular/material/radio";
import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";
import {Nullable} from "../login/login.component";
import {validate} from "graphql/validation";
import {AuthService} from "../../../services/auth.service";

@Component({
  selector: 'app-forgot-pasword',
  templateUrl: './forgot-pasword.component.html',
  standalone:false,
  styleUrl: './forgot-pasword.component.css'
})
export class ForgotPaswordComponent {
  @Output() result = new EventEmitter<any>();
  constructor(private authService:AuthService) {

  }
  method: 'admin' | 'email' | 'sms' = 'admin';
  email = '';
  phone = '';
  code = '';
  step = 0 ;
  message = '';
  error = '';
  confirmPwd = '';
  pasword = '';


  nextStep() {

    this.error = '';
    this.message = '';

    if (this.method === 'admin') {
      if (!this.phone || this.phone ==='') {
        this.error = "Votre numero doit etre envoyé a l'admin";
        return;
      }
      if (!this.authService.contactValidator(this.phone)) {
        this.error = "Verifier votre contact ";
        return;
      }
      this.authService.resetPasword(this.phone).subscribe( (result:any) => {
        if (result.body.result == 'success') {
          this.error ='';
          this.message = result.body.message;
          this.step = 2;
        } else {
          this.error = result.body.message;
          this.message = '';
        }
      }, error1 => {
        this.error = error1.body.message;
      })

     return;
    }
    if (this.method === 'email' && !this.email) {
      this.error = 'Veuillez entrer un e-mail valide.';
      return;
    }
    if (this.method === 'sms' && !this.phone) {
      this.error = 'Veuillez entrer un numéro valide.';
      return;
    }
    if (this.method === 'sms') {
      this.message = `📱 Code envoyé à ${this.phone}`;
    } else {
      this.message = this.method === 'email'
        ? `📧 Lien envoyé à ${this.email}`
        : '';
    }
    this.step = 2;

  }

  verifyCode() {
    this.message ='';
     this.authService.verificationCodeReset(this.phone,this.code) .subscribe( (result:any) => {
       if (result.body.result === 'success') {
         this.message = result.body.message;
         this.error = '';
         this.step = 3;
       } else {
         this.error = result.body.message;
         this.message ='';
       }
     }, error1 => {
         this.error = '❌ '+error1.code;

       }
     )
  }
  newPassword(){
    this.authService.newPasword(this.phone, this.pasword,this.code).subscribe ((result:any) => {
      if (result.body.result === 'success') {
        this.message = result.body.message;
        this.error = '';
        this.result.emit(true);
      } else {
        this.error = result.body.message;
        this.message ='';
      }
    })
  }



  passwordIsValid() {
    if (!this.pasword || !this.confirmPwd) {
      return false;
    }
    if (this.pasword != this.confirmPwd) {
      return false;
    }
    return true;
  }
  cancel(){
    this.result.emit(false);
  }
}
