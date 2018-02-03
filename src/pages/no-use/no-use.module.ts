import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NoUsePage } from './no-use';

@NgModule({
  declarations: [
    NoUsePage,
  ],
  imports: [
    IonicPageModule.forChild(NoUsePage),
  ],
})
export class NoUsePageModule {}
