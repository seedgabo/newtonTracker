import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController, NavParams, Platform, IonicPage } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-panic-logs',
  templateUrl: 'panic-logs.html',
})
export class PanicLogsPage {
  panics: any = { data: [] };
  loading = false;
  constructor(public navCtrl: NavController, public navParams: NavParams, public api: Api, public platform: Platform) {
  }

  ionViewDidLoad() {
    this.getPanics();
  }

  getPanics() {
    this.loading = true;
    this.api.get('panics?with[]=user&with[]=entidad&order[created_at]=desc&paginate=500')
      .then((data: any) => {
        console.log(data);
        this.panics = data;
        this.loading = false;
      })
      .catch((err) => {
        console.error(err);
        this.loading = false;
      })
  }

  openMap(panic) {
    if (!panic.location) {
      return;
    }
    var addressLongLat = panic.location.latitude + ',' + panic.location.longitude;
    window.open("http://maps.google.com/?q=" + addressLongLat, "_system");
  }

}
