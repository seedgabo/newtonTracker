import { PipesModule } from './../../pipes/pipes.module';
import { MomentModule } from 'angular2-moment';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TripPage } from './trip';

@NgModule({
  declarations: [
    TripPage,
  ],
  imports: [
    IonicPageModule.forChild(TripPage),
    MomentModule,
    PipesModule
  ],
})
export class TripPageModule {}
