import { AnimationSelectMenuComponent } from './animation-select-menu/animation-select-menu.component';
import { AnimationExamplesRoutes } from './animation-examples.routing';
import { FollowComponent } from './follow/follow.component';
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationExamplesComponent } from './animation-examples.component';
import { ContactComponent } from './contact/contact.component';
import { NavigationComponent } from './navigation/navigation.component';
import {MatButtonModule} from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {ExempleAnimationRoutingModule} from "./exemple.animation.routing.module";

@NgModule({

  declarations: [
    AnimationExamplesComponent,
    HomeComponent,
    AboutComponent,
    ContactComponent,
    FollowComponent,
    NavigationComponent,
    AnimationSelectMenuComponent
  ],
  imports: [
    CommonModule,
    ExempleAnimationRoutingModule,
    MatButtonModule,
    MatMenuModule
  ],
  exports: []
})
export class AnimationExamplesModule { }
