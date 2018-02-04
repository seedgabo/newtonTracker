import { BackgroundMode } from '@ionic-native/background-mode';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ViewController } from 'ionic-angular';
import moment from 'moment';
moment.locale("es");

@IonicPage()
@Component({
  selector: 'page-panic',
  templateUrl: 'panic.html',
})
export class PanicPage {

  user: any = {};
  entidad: any = {};
  location = null;
  datetime = moment.utc();
  prepareData = (data) => {
    console.log(data);
    this.user = data.user;
    this.entidad;
    this.location = data.location;
    if (data.datetime)
      this.datetime = moment.utc(data.date);

    if (!this.datetime.isValid())
      this.datetime = moment.utc();
  }

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewctrl: ViewController, public events: Events, public backgroundmode: BackgroundMode) {
    this.user = this.navParams.get('user')

    if (this.navParams.get('entidad'))
      this.entidad = this.navParams.get('entidad')

    if (this.navParams.get('location'))
      this.location = this.navParams.get('location');

    if (this.navParams.get('datetime'))
      this.datetime = moment.utc(this.navParams.get('datetime').date);

    if (!this.datetime.isValid())
      this.datetime = moment.utc();


  }


  ionViewDidLoad() {
    this.events.subscribe("panic", this.prepareData);
    this.backgroundmode.unlock();
    this.backgroundmode.wakeUp();
    this.backgroundmode.moveToForeground();

  }

  close() {
    if (this.navParams.get('sound'))
      this.navParams.get('sound').pause()
    this.viewctrl.dismiss();
    this.events.unsubscribe("panic", this.prepareData);
  }

  openInMaps() {
    if (!this.location) {
      return
    }
    var addressLongLat = this.location.latitude + ',' + this.location.longitude;
    var label = "SOS: " + this.user.name;
    window.open("http://maps.google.com/?q=" + addressLongLat + "(" + label + ")", "_system");

  }

}
