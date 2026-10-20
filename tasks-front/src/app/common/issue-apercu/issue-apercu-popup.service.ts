import {Injectable} from '@angular/core';
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {Issue} from "../../type/issue";
import {IssueApercuData} from "./issue-apercu.model";
import {IssueApercuDialogComponent} from "./issue-apercu-dialog.component";

/**
 * Ouvre l'aperçu d'un projet (issue master) ou d'une sous-tâche.
 *
 * N'importe quelle vue l'appelle avec l'issue ou son identifiant : la popup
 * charge elle-même ses données.
 */
@Injectable({
  providedIn: 'root'
})
export class IssueApercuPopupService {

  constructor(private readonly dialog: MatDialog) {
  }

  ouvrir(issue: Issue | number): MatDialogRef<IssueApercuDialogComponent> {
    const issueId = typeof issue === 'number' ? issue : issue.id;
    return this.dialog.open<IssueApercuDialogComponent, IssueApercuData>(IssueApercuDialogComponent, {
      data: {issueId},
      width: 'auto',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'issue-apercu-dialog-panel',
      autoFocus: false,
    });
  }
}
