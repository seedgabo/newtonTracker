import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { BgProvider } from '../../providers/bg/bg';
import { Events } from 'ionic-angular';
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  disabled_panic = false;
  edition = false;
  constructor(public navCtrl: NavController, public api: Api, public bg: BgProvider, public events: Events, public toast:ToastController) {
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
    this.disabled_panic = true;
    this.api.panic()
      .then(() => {
        this.disabled_panic = false;
      })
      .catch(() => {
        this.disabled_panic = false;
      });
  }

  locate() {
    this.bg.locate()
  }

  saveUser(){
    this.api.put('users/'+this.api.user.id,{
      nombre: this.api.user.nombre,
      email: this.api.user.email,
      documento: this.api.user.documento,
    })
    .then((resp)=>{
        this.edition =false;
        this.api.saveUser(this.api.user)
        this.toast.create({
          message: "Usuario Actualizado",
          duration: 2000
        }).present();
    })
    .catch((err)=>{
      this.api.Error(err)
    })
  }



}
