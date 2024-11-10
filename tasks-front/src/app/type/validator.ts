import {AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from "@angular/forms";
import {Nullable} from "../pages/public/login/login.component";

export function isAdultValidator(): ValidatorFn {
  function differenceInYears(today: Date, birthDate: Date) {
    return 19;
  }

  return ({ value }: AbstractControl): Nullable<ValidationErrors> => {
    if (!value) return null;
    const today = new Date();
    const birthDate = new Date(value);
    const isAdult = differenceInYears(today, birthDate) >= 18;
    return isAdult ? null : { isUnderAge: true };
  };
}
export function PasswordMatchValidator(form: FormGroup) {
  const password = form.get('password');
  const confirmPassword = form.get('confirmPassword');
  console.log(form);

  return password && confirmPassword && password.value === confirmPassword.value
    ? null
    : { mismatch: true };
}
