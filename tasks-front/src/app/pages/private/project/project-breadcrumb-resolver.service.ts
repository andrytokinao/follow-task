import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Breadcrumb } from '../../../type/issue';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectBreadcrumbResolverService implements Resolve<Breadcrumb[]> {
  alls: Breadcrumb[] = [
    { name: 'Home', path: 'list', others: [] },
    { name: 'Diagram', path: 'gantt-chart', others: [] },
    { name: 'Document', path: 'document', others: [] },
    { name: 'Dashboard', path: 'board', others: [] },
    { name: 'Calendar', path: 'calendar', others: [] },
    { name: 'Configuration', path: 'config', others: [] },
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
          });
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
    return [
      { name:  'Home', path: path+'list', others: [] },
      { name: 'Diagram', path: path+'/gantt-chart', others: [] },
      { name: 'Document', path: path+'/document', others: [] },
      { name: 'Dashboard', path: path+'/board', others: [] },
      { name: 'Calendar', path: path+'/calendar', others: [] },
      { name: 'Configuration', path: path+'/config', others: [] },
    ];
  }
}
