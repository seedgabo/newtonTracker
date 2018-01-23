import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PanicLogsPage } from './panic-logs';
import { MomentModule } from 'angular2-moment';

@NgModule({
  declarations: [
    PanicLogsPage,
  ],
  imports: [
    MomentModule,
    IonicPageModule.forChild(PanicLogsPage),

  ],
})
export class PanicLogsPageModule { }
