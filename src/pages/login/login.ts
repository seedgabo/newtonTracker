import { Api } from "./../../providers/Api";
import { Component } from "@angular/core";
import { NavController, NavParams, LoadingController, AlertController, Platform, Events } from "ionic-angular";
import { DomSanitizer } from "@angular/platform-browser";
declare var window: any;
@Component({
  selector: "page-login",
  templateUrl: "login.html"
})
export class LoginPage {
  backimg;
  preconfigured = false;
  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public navParams: NavParams,
    public loading: LoadingController,
    public alert: AlertController,
    public sanitizer: DomSanitizer,
    public api: Api,
    public events: Events
  ) {
    if (window.url) {
      this.preconfigured = true;
    }
  }

  ionViewDidLoad() {
    this.api.ready.then(() => {
      this.backimg = this.sanitizer.bypassSecurityTrustStyle("url('" + this.api.url + "img/fondo (1).jpg')");
      console.log(this.backimg);
    });
  }

  doLogin() {
    if (this.api.url.indexOf("http") == -1) {
      this.api.url = `http://newton.eycproveedores.com/${this.api.url}/public/`;
    }
    if (this.api.url[this.api.url.length - 1] != "/") {
      this.api.url += "/";
    }
    var loading = this.loading.create({ content: "Iniciando Sesión" });
    loading.present();
    this.api
      .doLogin()
      .then((response: any) => {
        this.api.get("lang").then((langs) => {
          this.api.langs = langs;
        });
        loading.dismiss();
        this.api.saveUser(response);
        this.api.saveData();
        this.api.user = response;
        this.events.publish("login", {});
      })
      .catch(() => {
        loading.dismiss();
        this.alert.create({ title: "Error", message: "Error al iniciar sesión", buttons: ["Ok"] }).present();
      });
  }

  forgotPassword() {
    this.alert
      .create({
        title: "Olvide mi contraseña",
        inputs: [
          {
            label: "email",
            type: "email",
            name: "email",
            placeholder: "Correo"
          }
        ],
        buttons: [
          {
            text: "Recuperar",
            handler: (data) => {
              var email = data.email;
              this.api
                .get("forgot-password?email=" + email)
                .then((data) => {
                  this.alert
                    .create({
                      title: "correo enviado",
                      subTitle: "Revise su bandeja de entrada",
                      buttons: ["OK"]
                    })
                    .present();
                })
                .catch((err) => {
                  this.alert
                    .create({
                      title: "no se pudo enviar el correo de recuperación",
                      buttons: ["OK"]
                    })
                    .present();
                });
            }
          }
        ]
      })
      .present();
  }
}
