import { ListPage } from './../list/list';
import { HomePage } from './../home/home';
import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController, Platform } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
declare var window:any
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  backimg;
  preconfigured = false
  constructor(public platform:Platform, public navCtrl: NavController, public navParams: NavParams, public loading: LoadingController, public alert: AlertController, public sanitizer: DomSanitizer, public api: Api) {
    if (window.url) {
      this.preconfigured = true;
    }
  }

  ionViewDidLoad() {
    this.api.ready.then(() => {
      this.backimg = this.sanitizer.bypassSecurityTrustStyle("url('" + this.api.url + "img/fondo (1).jpg')");
      console.log(this.backimg);
    })
  }

  doLogin() {
    var loading = this.loading.create({ content: "Iniciando Sesión" });
    loading.present();
    this.api.doLogin().then((response: any) => {
      loading.dismiss();
      this.api.saveUser(response);
      this.api.saveData()
      this.api.user = response;
      if (this.platform.is('mobile')) {
        this.navCtrl.setRoot(HomePage);
      } else {
        this.navCtrl.setRoot(ListPage);
      }

    })
      .catch(() => {
        loading.dismiss();
        this.alert.create({ title: "Error", message: "Error al iniciar sesión", buttons: ["Ok"] }).present();
      });
  }


  forgotPassword() {
    this.alert.create({
      title: "Olvide mi contraseña",
      inputs: [
        {
          label: 'email',
          type: 'email',
          name: 'email',
          placeholder: 'Correo'
        }
      ],
      buttons: [
        {
          text: 'Recuperar',
          handler: (data) => {
            var email = data.email;
            this.api.get('forgot-password?email=' + email)
              .then((data) => {
                this.alert.create({
                  title: "correo enviado",
                  subTitle: "Revise su bandeja de entrada",
                  buttons: ["OK"]
                }).present();
              })
              .catch((err) => {
                this.alert.create({
                  title: "no se pudo enviar el correo de recuperación",
                  buttons: ["OK"]
                }).present();
              });
          }
        }
      ]
    }).present();
  }
}
