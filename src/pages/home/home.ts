import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { BgProvider } from '../../providers/bg/bg';
import { Events } from 'ionic-angular';
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, public api: Api, public bg: BgProvider, public events: Events) {
  }

  ionViewDidLoad() {
    this.api.startEcho();
  }

  start() {
    this.bg.startTrack();
  }

  stop() {
    this.bg.stopTrack();
  }

  sos() {

  }
  locate() {
    this.bg.locate()
  }



}
