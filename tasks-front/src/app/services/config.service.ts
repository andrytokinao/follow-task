import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {ConfigEntry, Issue, Project, Status, User} from "../type/issue";
import {ALL_ISSUE, ALL_USERS, LOAD_GROUPE_MEMBER, SAVE_CONFIG, SAVE_USER} from "../type/graphql.operations";
import {Apollo} from "apollo-angular";
import {NavigationExtras, Router} from "@angular/router";
import {IssueService} from "./issue.service";
import {environment} from "@ng-bootstrap/ng-bootstrap/environment";
import {ssenvironment} from "../../environments/ssenvironment";

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  installationPath:String ="";
  configEntry :ConfigEntry | any = {}
  codePath:String ="";
  project:Project | null = null;
  public nextEvent: EventEmitter<any> = new EventEmitter();
  onNext(data: any) {
    this.nextEvent.emit(data);
  }
  constructor(private http: HttpClient, private apollo: Apollo, private router:Router, private issueService:IssueService) {

  }
  userIsExist:Boolean = false;
  baseUrl:string = ssenvironment.apiURL;

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
  saveConfig(typeValue:string , value:string, configId:number ) {
    const params = new HttpParams()
      .set('type',typeValue)
      .set('value',value)
      .set('configId',configId);
   return this.http.post<ConfigEntry[]>(ssenvironment.apiURL+'/api/save-config?'+params.toString(), {},{withCredentials:true})
  }
  loadConfig(){
    return new Observable<ConfigEntry>((observer)=>{
      console.info('initConfig()')
      this.http.get<ConfigEntry>(ssenvironment.apiURL+"/api/get-config",{withCredentials:true}).subscribe(
        (res)=>{
          this.configEntry = res;
          console.info("loading config"+JSON.stringify(res));
          observer.next(res);
          observer.complete();
        } , (error) => {
          console.error(error);
          observer.error(error);
          observer.complete();
        }
      )
    })
  }
  getCodePath(){
    console.info('getCodePath')
    return this.http.get<any>(ssenvironment.apiURL+"/code-path",{withCredentials:true})
  }
  nextIntallation(){
    return new Observable<string>((observable:any)=>{
      this.http.get<any>(ssenvironment.apiURL+"/next-installation-path",{withCredentials:true}).subscribe(
        (res:any)=>{
          this.installationPath = res.path;
          observable.next(this.installationPath);
          observable.complete();
        },error => {
          observable.error(error);
          observable.complete;
        }
      )
    })
  }

  checkUser(){
    return  this.http.get<Boolean>(ssenvironment.apiURL+"/has-user");
  }

  loadProject(prefix: String) {
    return new Observable<Project>((observer) => {
      this.issueService.getProject(this.configEntry.projectPrefix).subscribe(
        (res: Project) => {
          this.project = res;
          observer.next(this.project);
          observer.complete();
        },
        (err: any) => {
          observer.error(err);
        }
      );
    });
  }
}
