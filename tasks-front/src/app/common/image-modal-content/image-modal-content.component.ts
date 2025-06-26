import { Component, Input } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../services/issue.service";
import {environment} from "../../../environments/environment";
import {AuthGuard} from "../../services/SystemGuard";

@Component({
  standalone:false,
  selector: 'app-image-modal-content',
  templateUrl: './image-modal-content.component.html',
  styleUrls: ['./image-modal-content.component.css']
})
export class ImageModalContentComponent {
  images: string[] = []; // Input to receive image URLs
  protected current_image: String ="";

  constructor(
    public activeModal: NgbActiveModal,
    protected authGuard:AuthGuard,
    private issueService:IssueService
  ) {
    issueService.currentSlidingImage$.subscribe(image => {
      this.current_image = environment.apiURL+"photo/"+image.absolutePath;
    });
  }
  // Inject NgbActiveModal
/*
  current_image:String = this.images[0];
*/

  nextImage() {
    this.issueService.slideSuivanteImage();
  }
}
