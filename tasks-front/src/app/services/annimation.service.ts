import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {ConfigEntry, GroupeUser, Issue, MemberGroupe, Permission, Status, User} from "../type/issue";
import {
  ADD_USER_IN_GROUPE,
  ALL_ISSUE,
  ALL_USERS, GET_GROUPE_USER_FOR_PROJECT, GET_USER,
  INIT_USER,
  LOAD_GROUPE_MEMBER,
  SAVE_CONFIG,
  LOAD_PERMISSION_TASK,
  SAVE_USER, supprimerTypename
} from "../type/graphql.operations";
import {Apollo} from "apollo-angular";
import {environment} from "../../environments/environment";
import {stripTypename} from "@apollo/client/utilities";

@Injectable({
  providedIn: 'root',
})
export class AnnimationService {

}
