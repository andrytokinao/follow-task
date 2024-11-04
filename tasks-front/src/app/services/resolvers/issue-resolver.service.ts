import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {IssueService} from "../issue.service";

@Injectable({
  providedIn: 'root'
})
export class IssueResolverService  implements Resolve<any> {

  constructor(private issueService:IssueService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    const issueKey = route.paramMap.get('parrentIssue');
    if(issueKey != null)
      return this.issueService.getIssue(issueKey);
    return {};
  }
}
