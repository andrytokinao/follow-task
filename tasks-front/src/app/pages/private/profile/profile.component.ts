import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MemberGroupe, User } from '../../../type/issue';
import { UserService } from '../../../services/user.service';
import { supprimerTypename } from '../../../type/graphql.operations';
import { environment } from '../../../../environments/environment';

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const nw = form.get('newPassword')?.value;
  const cf = form.get('confirmPassword')?.value;
  return nw && cf && nw !== cf ? { mismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  constructor(private userService: UserService, private fb: FormBuilder) {}

  savingStatus: string = '';
  tempPhoto: string | ArrayBuffer | null = null;
  user: User | any = {};
  activeModal: any;
  action: string = '';
  memberGroupes: MemberGroupe[] = [];
  selectedPhoto: File | any = {};
  isCreate: boolean = false;

  // Visibilité mots de passe
  hideInitPw = true;
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  userForm!: FormGroup;
  passwordForm!: FormGroup;

  ngOnInit() {
    this.userForm = this.fb.group({
      username:  [this.user.username,  Validators.required],
      email:     [this.user.email,     [Validators.required, Validators.email]],
      firstName: [this.user.firstName],
      lastName:  [this.user.lastName],
      contact:   [this.user.contact],
      cin:       [this.user.cin],
      address:   [this.user.address],
      password:  [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: [''],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordMatchValidator });
  }

  get passwordStrength(): number {
    const pw: string = this.passwordForm.get('newPassword')?.value || '';
    let score = 0;
    if (pw.length >= 8) score += 33;
    if (/[A-Z]/.test(pw)) score += 33;
    if (/[0-9]/.test(pw)) score += 34;
    return score;
  }

  get passwordStrengthColor(): string {
    const s = this.passwordStrength;
    if (s < 40) return 'warn';
    if (s < 80) return 'accent';
    return 'primary';
  }

  get passwordStrengthLabel(): string {
    const s = this.passwordStrength;
    if (!this.passwordForm.get('newPassword')?.value) return '';
    if (s < 40) return 'Faible';
    if (s < 80) return 'Moyen';
    return 'Fort';
  }

  photoUrl(): string | ArrayBuffer {
    if (this.tempPhoto) return this.tempPhoto;
    return this.user?.photo
      ? environment.apiURL + 'photo/' + this.user.photo
      : 'assets/photo.png';
  }

  loadGroupeMember() {
    this.userService.loadGroupeMember(this.user.id).subscribe(
      (res: any) => { this.memberGroupes = supprimerTypename(res.data.loadGroupeMember); },
      (err) => { console.error('loadGroupeMember', err); }
    );
  }

  saveUser() {
    const data = { ...this.user, ...this.userForm.value };
    this.userService.saveUser(data).subscribe(
      () => { this.savingStatus = 'success'; },
      (err) => { this.savingStatus = 'error'; console.error(err); }
    );
  }

  changePassword() {
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.userService.changePassword(this.user.id, currentPassword, newPassword).subscribe(
      () => { this.passwordForm.reset(); this.savingStatus = 'success'; },
      (err) => { console.error(err); }
    );
  }

  selectPhoto($event: any) {
    const file: File = $event.target.files[0];
    if (file) { this.selectedPhoto = file; this.previewImage(file); }
  }

  previewImage(file: File) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => { this.tempPhoto = reader.result; };
  }

  openPhotoInput() {
    document.getElementById('photoInput')?.click();
  }

  uploadPhoto() {
    this.userService.upload(this.selectedPhoto, this.user.id).subscribe();
  }

  loadUser(userId: string) {
    this.userService.getUser(userId).subscribe((user: User) => {
      this.user = user;
      this.userForm?.patchValue(user);
    });
  }
}
