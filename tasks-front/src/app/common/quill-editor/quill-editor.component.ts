import { Component, Input, Output, EventEmitter } from '@angular/core';
import Quill from "quill";

@Component({
  standalone: false,
  selector: 'app-quill-editor',
  templateUrl: './quill-editor.component.html',
  styleUrls: ['./quill-editor.component.css']
})
export class EditorComponent {
  @Input()  content:String = '';
  @Output() html = new EventEmitter<string>();
  @Output() delta = new EventEmitter<any>();
  @Output() text = new EventEmitter<string>();
  @Output() contentChange = new EventEmitter<string>();
  @Input() theme: string = 'snow';
  modules: any = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ header: [1, 2, 3,4,5,6, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
    ],
  };

  onContentChanged(event: any) {
    this.contentChange.emit(event.html);
  /*  this.contentChange.emit(this.editor.root.innerHTML);
    this.html.emit(this.editor.root.innerHTML);
    this.delta.emit(this.editor.getDelta());
    this.text.emit(this.editor.getText());*/
  }

  // Fonction pour récupérer le contenu au format Delta
  getDeltaContent(quillEditor: any): void {
    const delta = quillEditor.getContents();
    console.log('Delta:', delta);
  }

  // Fonction pour récupérer le contenu au format HTML
  getHtmlContent(quillEditor: any): void {
    const html = quillEditor.root.innerHTML;
    console.log('HTML:', html);
  }

  // Fonction pour récupérer le contenu au format texte brut
  editor: any;
  getTextContent(quillEditor: any): void {
    const text = quillEditor.getText();
    console.log('Texte brut:', text);
  }

  initEditor(e: Quill) {
    this.editor = e;
  }
}
