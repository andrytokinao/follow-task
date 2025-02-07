import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Breadcrumb } from '../../../type/issue';
import {BehaviorSubject, Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectBreadcrumbResolverService implements Resolve<Breadcrumb[]> {
  private curentBreadcrumbSubject = new BehaviorSubject<Breadcrumb>(undefined);
  curentBreadcrumb$ = this.curentBreadcrumbSubject.asObservable();
  alls: Breadcrumb[] = [
    { name:  'Home', path: 'list', others: [] ,order:1 },
    { name: 'Diagram', path: 'gantt-chart', others: [],order:2 },
    { name: 'Dashboard', path: 'board', others: [],order:3 },
    { name: 'Raport', path: 'rapport', others: [],order:4 },
    { name: 'Calendar', path: 'planning', others: [],order:7 },
    { name: 'Document', path: 'document', others: [],order:8 },
    { name: 'Configuration', path: 'config', others: [],order:9 },
  ];

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Breadcrumb[]> {
    const breadcrumbs: Breadcrumb[] = this.createBreadcrumbs(route);
    return of(breadcrumbs);
  }

  createBreadcrumbs(route: ActivatedRouteSnapshot): Breadcrumb[] {
    const breadcrumbs: Breadcrumb[] = [];
    let currentRoute: ActivatedRouteSnapshot | null = route;
    while (currentRoute) {
      const path = currentRoute.url.map((segment) => segment.path).join('/');
      const projectPrefix = route.paramMap.get('project');
      const breadcrumb = this.getByPath(path);
        if (breadcrumb) {
          breadcrumbs.unshift({
            name: breadcrumb.name,
            path: '/' + path,
            others: this.getOtherLinks(path),
            order:breadcrumb.order,
          });
          this.curentBreadcrumbSubject.next(breadcrumb);
        }

      currentRoute = currentRoute.parent;
    }
    return breadcrumbs;
  }

  getOtherLinks(path: string): Breadcrumb[] {
    return this.alls.filter((breadcrumb) => breadcrumb.path !== path);
  }

  getByPath(path: string): Breadcrumb | undefined {
    console.debug(path);
    return this.alls.find((breadcrumb) =>  path.includes(breadcrumb?.path));
  }
  getAll(path:string) : Breadcrumb[]{
    alert(path);
    return [
      { name:  'Home', path: path+'list', others: [] ,order:1 },
      { name: 'Diagram', path: path+'/gantt-chart', others: [],order:2 },
      { name: 'Dashboard', path: path+'/board', others: [],order:3 },
      { name: 'Raport', path: path+'/rapport', others: [],order:4 },
      { name: 'Calendar', path: path+'/planning', others: [],order:7 },
      { name: 'Document', path: path+'/document', others: [],order:8 },
      { name: 'Configuration', path: path+'/config', others: [],order:9 },
    ];
  }
}
