import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {IssueService} from "../issue.service";
import {Observable} from "rxjs";
import {Criteria, Issue} from "../../type/issue";
import {IssueSearchCriteriaInput} from "../../type/issue-search-criteria.util";

@Injectable({
  providedIn: 'root'
})
export class IssueResolverService  implements Resolve<any> {
  private criteria: IssueSearchCriteriaInput = {};

  constructor(private issueService:IssueService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    const issueKey = route.paramMap.get('parrentIssue');
    const projectPrefix = route.paramMap.get('project');
    if(issueKey != null && projectPrefix)
      this.criteria = {
         key:issueKey,
        projectPrefix:projectPrefix
      }
      this.issueService.setIssueMasterCriteria(this.criteria);
    return {};
  }
}
