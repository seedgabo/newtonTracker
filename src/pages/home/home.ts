import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BgProvider } from '../../providers/bg/bg';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  constructor(public navCtrl: NavController, public api: Api, public bg: BgProvider) {

  }

  ionViewDidLoad() {
  }

  start() {
    this.bg.startTrack();
  }

  stop() {
    this.bg.stopTrack();
  }

}
