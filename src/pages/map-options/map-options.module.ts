import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MapOptionsPage } from './map-options';

@NgModule({
  declarations: [
    MapOptionsPage,
  ],
  imports: [
    IonicPageModule.forChild(MapOptionsPage),
  ],
})
export class MapOptionsPageModule {}
