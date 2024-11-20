import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrl: './document.component.css'
})
export class DocumentComponent implements OnInit{
  documents = [
    { title: 'Configuration de espace de travaile', file: 'configuration-work-space.md' },

  ];

  selectedDocument: string = '';
  markdownContent: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDocument(this.documents[0].file);
  }

  loadDocument(file: string): void {
    this.http.get(`assets/markdown/${file}`, { responseType: 'text' })
      .subscribe(data => {
        this.markdownContent = data;
        this.selectedDocument = file;
      });
  }
}
