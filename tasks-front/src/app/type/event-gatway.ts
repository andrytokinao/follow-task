import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import {SeatsAvailability} from "./issue";

@Injectable({
  providedIn: 'root'
})
export class EventGateway {

  retrieveRemainingSeats(): Observable<SeatsAvailability> {
    return of({remainingSeats: 8});
  }
}
