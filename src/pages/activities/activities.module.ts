import { PipesModule } from './../../pipes/pipes.module';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ActivitiesPage } from './activities';
import { MomentModule } from 'angular2-moment';
import { VirtualScrollModule } from 'angular2-virtual-scroll';

@NgModule({
  declarations: [
    ActivitiesPage,
  ],
  imports: [
    IonicPageModule.forChild(ActivitiesPage),
    MomentModule,
    PipesModule,
    VirtualScrollModule
  ],
})
export class ActivitiesPageModule { }
