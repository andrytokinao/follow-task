import { Component } from '@angular/core';
import {Uploaded} from "../../type/issue";
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-pdf-overview',
  templateUrl: './pdf-overview.component.html',
  styleUrl: './pdf-overview.component.css'
})
export class PdfOverviewComponent {
  pdfSrc: string | ArrayBuffer | null = null;
  private pdfUrl: string = "http://localhost:8081/api/fech-file?fileName=rTCGhrotH42atGtThptzCtrMiFFiU8E5A7rUiB78AI53urE5A7rcuD5fcuNZr3iDDufEArY1YZb9p6NObVRNYbp6NtRV9NL66ObY1OL4wx&fileType=pdf";
  private uploaded:Uploaded;

  constructor(private http:HttpClient) {}


  ngOnInit(): void {
    this.loadPdf();
  }

  loadPdf(): void {
    this.getPdf().subscribe((pdfBlob) => {
      console.debug("loading pdf",pdfBlob);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        this.pdfSrc = fileReader.result;
      };
      fileReader.readAsDataURL(pdfBlob);
    });
  }
  getPdf(){
      if (this.uploaded)
        this.pdfUrl = environment.apiURL+'api/download/'+this.uploaded.encodedPath+'directory=andry.kely&fileName='+this.uploaded.name;
      return this.http.get(this.pdfUrl,{
        responseType:'blob',
        withCredentials:true
      });
  }
}
