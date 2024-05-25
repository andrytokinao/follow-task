import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {IssueService} from "../issue.service";

@Injectable({
  providedIn: 'root'
})
export class ProjectResolverService implements Resolve<any>{

  constructor(private issueService: IssueService) {}
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    const projectPrefix = route.paramMap.get('project');
    if(projectPrefix != null)
      return this.issueService.getProject(projectPrefix);
    return {};
  }
}
