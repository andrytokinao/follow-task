import {Component, Input} from '@angular/core';
import {Repertoire, Uploaded} from "../../type/issue";
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-pdf-overview',
  templateUrl: './pdf-overview.component.html',
  styleUrl: './pdf-overview.component.css'
})
export class PdfOverviewComponent {
  pdfSrc: string | ArrayBuffer | null = null;
  uploaded:Uploaded;
  @Input()
  set setUploaded(uploaded:Uploaded){
    this.uploaded = uploaded;
    this.loadPdf();
  }


  protected pdfUrl: string = "http://localhost:8081/assets/pdf/Prise_en_main_de_PYTHON_3.pdf";

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
         this.pdfUrl = environment.apiURL+'api/fech-file?fileType=pdf&fileName='+this.uploaded.encodedPath;
      console.debug('selectedPdfFile',this.uploaded);
      return this.http.get(this.pdfUrl,{
        responseType:'blob',
        withCredentials:true
      });
  }
}
