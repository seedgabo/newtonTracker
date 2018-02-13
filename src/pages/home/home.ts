import { SplashScreen } from '@ionic-native/splash-screen';
import { CodePush } from '@ionic-native/code-push';
import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController, ToastController, Platform } from 'ionic-angular';
import { BgProvider } from '../../providers/bg/bg';
import { Events } from 'ionic-angular';
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  disabled_panic = false;
  edition = false;
  version_data
  constructor(public navCtrl: NavController, public api: Api, public bg: BgProvider, public events: Events, public toast: ToastController, public codepush: CodePush, public splashScreen: SplashScreen, public platform:Platform) {
  }

  ionViewDidLoad() {
    this.api.startEcho();
    this.platform.ready().then(() => {
      this.codepush.getCurrentPackage()
        .then((data) => {
          this.version_data = data
        })
        .catch((err) => {
          console.warn(err)
        });
    })
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

  saveUser() {
    this.api.put('users/' + this.api.user.id, {
      nombre: this.api.user.nombre,
      email: this.api.user.email,
      documento: this.api.user.documento,
    })
      .then((resp) => {
        this.edition = false;
        this.api.saveUser(this.api.user)
        this.toast.create({
          message: "Usuario Actualizado",
          duration: 2000
        }).present();
      })
      .catch((err) => {
        this.api.Error(err)
      })
  }

  sync() {
    this.platform.ready().then(() => {
      this.codepush.sync({ updateDialog: true }, )
        .subscribe((status) => {
          var msg = ""
          if (status == 0) {
            msg = "La app esta actualizada";
          }
          if (status == 4) {
            msg = "En progreso";
          }
          if (status == 5) {
            msg = "Buscando Actualización";
          }
          if (status == 7) {
            msg = "Instalando Actualización";
          }
          if (status == 8) {
            msg = "La app se reiniciará";
            this.splashScreen.show();
          }
          this.toast.create({ message: msg, duration: 2000 }).present();
        }, (err) => {
          console.warn(err);
          this.splashScreen.hide();
        });
    });
  }



}
