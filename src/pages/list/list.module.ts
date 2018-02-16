import { VirtualScrollModule } from 'angular2-virtual-scroll';
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
    VirtualScrollModule
  ],
})
export class ListPageModule { }
