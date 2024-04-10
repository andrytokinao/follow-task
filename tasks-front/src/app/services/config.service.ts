import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {ConfigEntry, Issue, Status, User} from "../type/issue";
import {ALL_ISSUE, ALL_USERS, LOAD_GROUPE_MEMBER, SAVE_CONFIG, SAVE_USER} from "../type/graphql.operations";
import {Apollo} from "apollo-angular";

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  configEntry :ConfigEntry | any = {}
  codePath:String ="";
  public nextEvent: EventEmitter<any> = new EventEmitter();
  onNext(data: any) {
    this.nextEvent.emit(data);
  }
  constructor(private http: HttpClient, private apollo: Apollo) {
    this.initConfig();
  }
  userIsExist:Boolean = false;
  baseUrl:string = "http://localhost:8081";

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };
  private header: any;

  saveConfigWithGQ(configEntry:any) {
    return this.apollo
      .mutate({
          mutation : SAVE_CONFIG,
          variables :{configEntry}
        }
      );
  }
  saveConfig(typeValue:string , value:string ) {
    const params = new HttpParams()
      .set('type',typeValue)
      .set('value',value)
      .set('configId',this.configEntry.id);
   return this.http.post<ConfigEntry[]>('http://localhost:8081/api/save-config?'+params.toString(), {},{withCredentials:true})
  }
  initConfig(){
    console.info('initConfig()')
    this.http.get<ConfigEntry>("http://localhost:8081/api/get-config",{withCredentials:true}).subscribe(
      (res)=>{
        this.configEntry = res;
      } , (error) => {
        console.error(error);
      }
    )
  }
  getCodePath(){
    console.info('getCodePath')
    return this.http.get<any>("http://localhost:8081/code-path",{withCredentials:true})

  }
  isComplete():boolean{
    if(!this.configEntry)
      return false;
    if(!this.configEntry.workDirectory)
      return false;
    if(!this.configEntry.mediaDirectory)
      return false
    return true;
  }
  checkUser(){
    return  this.http.get<Boolean>("http://localhost:8081/has-user");
  }
}
