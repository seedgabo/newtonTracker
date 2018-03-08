import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { SettingProvider } from '../../providers/setting/setting';

@IonicPage()
@Component({ selector: 'page-settings', templateUrl: 'settings.html' })
export class SettingsPage {
  timeout = null
  constructor(public navCtrl: NavController, public navParams: NavParams, public setting: SettingProvider) { }

  ionViewDidLoad() { }

  save() {
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      this.setting.save()
      console.log("settings saved")
    }, 1200);
  }
}
