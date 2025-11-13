import { Component } from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-show-directory',
  templateUrl: './show-directory.component.html',
  imports: [
    NgForOf,
    NgIf
  ],
  styleUrls: ['./show-directory.component.scss']
})
export class ShowDirectoryComponent {
  directories = [
    {
      name: 'Documents',
      files: ['cv.pdf', 'lettre_motivation.docx'],
      subdirs: [{ name: 'Archives', files: ['2022.zip'], subdirs: [] }]
    },
    {
      name: 'Images',
      files: ['photo1.jpg', 'photo2.png'],
      subdirs: []
    }
  ];

  selectedFiles: File[] = [];
  isUploading = false;
  progress = 0;

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) this.addFiles(files);
  }

  onFileSelected(event: any) {
    this.addFiles(event.target.files);
  }

  addFiles(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      this.selectedFiles.push(fileList[i]);
    }
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) return;
    this.isUploading = true;
    this.progress = 0;
    const interval = setInterval(() => {
      if (this.progress >= 100) {
        clearInterval(interval);
        this.isUploading = false;
        this.selectedFiles = [];
      } else {
        this.progress += 10;
      }
    }, 300);
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }
}
