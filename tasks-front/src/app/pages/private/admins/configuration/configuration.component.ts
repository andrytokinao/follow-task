import {Component, OnDestroy, OnInit} from '@angular/core';
import {ConfigEntry} from "../../../../type/issue";
import {WorkSpaceComponent} from "./work-space/work-space.component";
import {MediaSpaceComponent} from "./media-space/media-space.component";
import {NavigationStart, Router} from "@angular/router";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../services/config.service";
import {SwitchVersionComponent} from "./switch-version/switch-version.component";
import {ArchiveComponent} from "./archive/archive.component";
import {BackupComponent} from "./backup/backup.component";
import {InstallDataComponent} from "./install-data/install-data.component";

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css'
})
export class ConfigurationComponent implements OnInit, OnDestroy {

  configEntry: ConfigEntry | any = {};
  dialogMap: { [regex: string]: any } = {
    '\/backup$': BackupComponent,
    '\/archive$': ArchiveComponent,
    '\/switch-version$': SwitchVersionComponent,
    '\/media-space$': MediaSpaceComponent,
    '\/work-space$': WorkSpaceComponent,
    '\/install-data$': InstallDataComponent,
  };

  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
  ) {
    this.showDialogue(this.router.url);
  }
  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
    //    this.showDialogue(this.router.url);
      }
    });
  }
  showDialogue(currentUrl:string){
    let dialogRef: any = {};
    for (const regexStr in this.dialogMap) {
      const regex = new RegExp(regexStr);

      if (regex.test(currentUrl)) {
        const dialogComponent = this.dialogMap[regexStr];
        dialogRef = this.modalService.open(dialogComponent, {windowClass: "xlModal"});
        return;
      }
    }
    this.configService.loadConfig().subscribe(value => {
        dialogRef.componentInstance.configEntry = value;
      }
    );
  }

  openModal(url:string) {
     this.showDialogue('/private/admin/config/'+url);
  }
  ngOnDestroy() {
    this.router.events.subscribe().unsubscribe();
  }

}
