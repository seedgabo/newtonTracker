import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-no-use',
  templateUrl: 'no-use.html',
})
export class NoUsePage {

  constructor(public navCtrl: NavController, public navParams: NavParams, public api: Api) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad NoUsePage');
  }

}
