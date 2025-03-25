import { Component } from '@angular/core';

interface Document {
  id: number;
  title: string;
  description: string;
  fileName: string;
  uploadedBy: string;
  uploadedDate: string;
}

@Component({
  standalone:false,
  selector: 'app-document-uploader',
  templateUrl: './document-uploader.component.html',
  styleUrls: ['./document-uploader.component.css']
})
export class DocumentUploaderComponent {
  documents: Document[] = [
    {
      id: 1,
      title: 'Document 1',
      description: 'Description du premier document.',
      fileName: 'document1.pdf',
      uploadedBy: 'Dupond',
      uploadedDate: '20 Déc 2024'
    },
    {
      id: 2,
      title: 'Document 2',
      description: 'Description du second document.',
      fileName: 'document2.pdf',
      uploadedBy: 'Dupont',
      uploadedDate: '21 Déc 2024'
    }
  ];

  selectedDocument: Document | null = null;
  fileInput: File | null = null;

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.fileInput = file;
      this.previewFile(file);
    }
  }

  selectDocument(doc: Document): void {
    this.selectedDocument = doc;
    this.fileInput = null;
  }

  previewFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const previewContainer = document.getElementById('file-preview')!;
      previewContainer.innerHTML = `<embed src="${reader.result}" width="100%" height="400px" />`;
    };
    reader.readAsDataURL(file);
  }
}
