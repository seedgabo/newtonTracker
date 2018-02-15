import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ListPage } from './list';
import { MomentModule } from 'angular2-moment';

@NgModule({
  declarations: [
    ListPage,
  ],
  imports: [
    MomentModule,
    IonicPageModule.forChild(ListPage),

  ],
})
export class ListPageModule { }
