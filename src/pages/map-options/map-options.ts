import { Storage } from '@ionic/storage';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-map-options',
  templateUrl: 'map-options.html',
})
export class MapOptionsPage {
  layers = {}
  default = null
  constructor(public navCtrl: NavController, public navParams: NavParams, public viewctrl:ViewController, public storage:Storage) {
    if(this.navParams.get('layers')){
      var obj = this.navParams.get('layers')
      this.layers = Object.keys(obj).map(function (key) { if (
        !obj[key].name)obj[key].name = key; 
        obj[key].key = key; 
        return obj[key]; });
    }
  }

  ionViewDidLoad() {
    this.storage.get('layer').then((layer)=>{
      this.default = layer
    })
  }

  selectLayer(layer){
    this.viewctrl.dismiss({action: 'layer', layer: layer});
  }
  
  close(){
    this.viewctrl.dismiss({action: 'cancel', role: 'cancel'});
  }

}
