import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-map-options',
  templateUrl: 'map-options.html',
})
export class MapOptionsPage {
  layers = {}
  constructor(public navCtrl: NavController, public navParams: NavParams, public viewctrl:ViewController) {
    if(this.navParams.get('layers')){
      var obj = this.navParams.get('layers')
      this.layers = Object.keys(obj).map(function (key) { if (!obj[key].name)obj[key].name = key; return obj[key]; });
    }
  }

  ionViewDidLoad() {
  }

  selectLayer(layer){
    this.viewctrl.dismiss({action: 'layer', layer: layer});
  }
  
  close(){
    this.viewctrl.dismiss({action: 'cancel', role: 'cancel'});
  }

}
