import { Component } from '@angular/core';

@Component({
  selector: 'app-dossier-source',
  templateUrl: './dossier-source.component.html',
  styleUrl: './dossier-source.component.css'
})
export class DossierSourceComponent {
  fileGroups = [
    {
      description: 'Brouillon',
      uploadDate: '2025-01-03',
      uploadedBy: 'Charlie Lemoine',
      groupDescription: 'Quelques fichiers brouillons pour le projet.',
      files: [
        {
          name: 'draft-image.png',
        },
        {
          name: 'draft-doc.pdf',

        }
      ]
    },
    {
      description: 'Version finale',
      uploadDate: '2025-01-05',
      uploadedBy: 'Alice Dupont',
      groupDescription: 'Fichiers finaux pour la version du projet.',
      files: [
        {
          name: 'final-image.png',
        },
        {
          name: 'final-doc.pdf',
        }
      ]
    }
  ];

  selectedFile: any = null;

  selectFile(file: any) {
    this.selectedFile = file;
  }
}
