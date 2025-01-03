import { Component } from '@angular/core';

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrl: './file-list.component.css'
})
export class FileListComponent {
  fileGroups = [
    {
      description: 'Brouillon',
      uploadDate: '2025-01-03',
      uploadedBy: 'Charlie Lemoine',
      groupDescription: 'Quelques fichiers brouillons pour le projet.',
      files: [
        {
          name: 'draft-image.png',
          type: 'image',
          previewUrl: 'assets/draft-image.png',
          uploadDate: '2025-01-03',
          uploadedBy: 'Charlie Lemoine',
          fileDescription: 'Image du brouillon du projet.'
        },
        {
          name: 'draft-doc.pdf',
          type: 'pdf',
          previewUrl: 'assets/draft-doc.pdf',
          uploadDate: '2025-01-03',
          uploadedBy: 'Charlie Lemoine',
          fileDescription: 'Document PDF du brouillon.'
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
          type: 'image',
          previewUrl: 'assets/final-image.png',
          uploadDate: '2025-01-05',
          uploadedBy: 'Alice Dupont',
          fileDescription: 'Image finale du projet.'
        },
        {
          name: 'final-doc.pdf',
          type: 'pdf',
          previewUrl: 'assets/final-doc.pdf',
          uploadDate: '2025-01-05',
          uploadedBy: 'Alice Dupont',
          fileDescription: 'Document PDF final du projet.'
        }
      ]
    }
  ];

  selectedFile: any = null;

  selectFile(file: any) {
    this.selectedFile = file;
  }
}
