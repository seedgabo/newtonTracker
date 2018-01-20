import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { BgProvider } from '../../providers/bg/bg';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  constructor(public navCtrl: NavController, public api: Api, public bg: BgProvider, public alert: AlertController) {

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

  locate() {
    this.bg.locate()
      .then((pos) => {
        this.postLocation(pos);
      })
  }

  postLocation(loc) {
    this.api.post("locations", {
      location: loc.coords,
      user_id: 1,
      timestamp: loc.timestamp,
      extra: {
        is_moving: loc.is_moving,
        battery: loc.battery,
        activity: loc.activity
      }
    })
      .then((resp) => {
        console.log(resp)
      })
      .catch((err) => {
        console.error(err)
      })
  }

}
