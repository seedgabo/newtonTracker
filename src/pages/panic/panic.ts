import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ViewController } from 'ionic-angular';
import { LocalNotifications } from "@ionic-native/local-notifications";
import { TextToSpeech } from "@ionic-native/text-to-speech";
import moment from 'moment';
import { SettingProvider } from '../../providers/setting/setting';
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

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewctrl: ViewController, public events: Events, public texttospeech: TextToSpeech, public localnotifications: LocalNotifications, public setting: SettingProvider) {
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
    if (this.setting.tts) {
      this.texttospeech.speak({
        locale: 'es-CO',
        text: "Alerta de Emergencia de: " + this.user.full_name,
      }).then(console.log).catch(console.error);
      this.localnotifications.schedule({
        id: 1,
        title: "Alerta de Emergencia",
        text: this.user.full_name,
        sound: null,
        led: 'FF0000',
      })
    }
    this.events.subscribe("panic", this.prepareData);
  }

  close() {
    if (this.navParams.get('sound'))
      this.navParams.get('sound').pause()
    this.texttospeech.stop()
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
