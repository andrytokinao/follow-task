import { Component } from '@angular/core';

@Component({
  selector: 'app-livraison',
  templateUrl: './livraison.component.html',
  styleUrl: './livraison.component.css'
})
export class LivraisonComponent {
  uploadedFiles: Array<{ name: string, userPhotoUrl: string, uploadDate: Date }> = [];

  selectFiles() {
    document.querySelector<HTMLInputElement>('#fileInput')?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        // Remplacer "userPhotoUrl" par l'URL réelle de la photo de l'utilisateur
        this.uploadedFiles.push({
          name: file.name,
          userPhotoUrl: 'assets/default-user-photo.jpg',
          uploadDate: new Date()
        });
      });
    }
  }

  downloadFile(file: any) {
    // Logique pour télécharger le fichier
  }

  deleteFile(file: any) {
    this.uploadedFiles = this.uploadedFiles.filter(f => f !== file);
  }
}
