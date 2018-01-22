import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PanicPage } from './panic';

@NgModule({
  declarations: [
    PanicPage,
  ],
  imports: [
    IonicPageModule.forChild(PanicPage),
  ],
})
export class PanicPageModule {}
