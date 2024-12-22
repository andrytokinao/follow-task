import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {IssueService} from "../issue.service";
import {Project} from "../../type/issue";

@Injectable({
  providedIn: 'root'
})
export class ProjectResolverService implements Resolve<any>{
  project:Project = undefined;

  constructor(private issueService: IssueService) {
    issueService.project$.subscribe(project => {
      this.project = project;
    })
  }
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    const projectPrefix = route.paramMap.get('project');
    if(projectPrefix != null) {
      return this.issueService.getProject(projectPrefix);
    }
    return this.issueService.project$;
  }
}
