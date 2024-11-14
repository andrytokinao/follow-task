import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private breadcrumbsSource = new BehaviorSubject<
    { label: string; url: string; subItems?: { label: string; url: string }[] }[]
  >([
    {
      label: 'Project',
      url: '/project',
      subItems: [
        { label: 'Project 1', url: '/project/1' },
        { label: 'Project 2', url: '/project/2' },
      ],
    },
    {
      label: 'Non-Projet',
      url: '/project/non-projet',
      subItems: [
        { label: 'Task A', url: '/project/non-projet/task-a' },
        { label: 'Task B', url: '/project/non-projet/task-b' },
      ],
    },
    {
      label: 'Nom-Tâche',
      url: '/project/non-projet/nom-tache',
    },
  ]);

  breadcrumbs = this.breadcrumbsSource.asObservable();

  setBreadcrumbs(breadcrumbs: { label: string; url: string; subItems?: { label: string; url: string }[] }[]) {
    this.breadcrumbsSource.next(breadcrumbs);
  }
}
