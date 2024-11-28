import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {Breadcrumb} from "../type/issue";

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private breadcrumbsSource = new BehaviorSubject<
    Breadcrumb[]
  >([]);

  breadcrumbs = this.breadcrumbsSource.asObservable();

  setBreadcrumbs(breadcrumbs: Breadcrumb[]) {
    this.breadcrumbsSource.next(breadcrumbs);
  }
  pushBreadcrumbs(breadcrumb: Breadcrumb) {
    const currentBreadcrumbs = this.breadcrumbsSource.getValue();
    const updatedBreadcrumbs = [...currentBreadcrumbs, breadcrumb];
    this.breadcrumbsSource.next(updatedBreadcrumbs);
  }
}
