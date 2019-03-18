import { BackgroundMode } from "@ionic-native/background-mode";
import { Vibration } from "@ionic-native/vibration";
import {
  Events,
  AlertController,
  ToastController,
  ModalController
} from "ionic-angular";
import { Injectable } from "@angular/core";
import { Http, Headers } from "@angular/http";
// import { Observable } from "rxjs/Observable";
import "rxjs/add/operator/map";
import { Storage } from "@ionic/storage";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { NgZone } from "@angular/core";
import { SettingProvider } from "./setting/setting";

declare var window: any;
window.Pusher = Pusher;
@Injectable()
export class Api {
  username: string;
  password: string;
  token: string;
  url: string = "https://newton.eycproveedores.com/newton/public/";
  locationiq_token = "92b5f8a059f8ab";
  Echo;
  user: any = null;
  objects: any = {};
  langs = {};
  ready = new Promise((resolve, reject) => {
    this.resolve = resolve;
  });
  resolve;
  sound;
  last_panic;
  addresses = {};
  constructor(
    public http: Http,
    public storage: Storage,
    public events: Events,
    public zone: NgZone,
    public alert: AlertController,
    public modal: ModalController,
    public toast: ToastController,
    public vibration: Vibration,
    public backgroundmode: BackgroundMode,
    public setting: SettingProvider
  ) {
    window.$api = this;
    this.initVar();
    this.ready.then(() => {
      if (this.user)
        this.get("lang")
          .then(langs => {
            this.langs = langs;
          })
          .catch(console.error);
    });
  }

  initVar() {
    this.storage.get("url").then(url_data => {
      if (window.url) this.url = window.url;
      else if (url_data) this.url = url_data;
    });
    this.storage
      .get("username")
      .then(data => (data != undefined ? (this.username = data) : ""));
    this.storage
      .get("password")
      .then(data => (data != undefined ? (this.password = data) : ""));
    this.storage.get("user").then(data => {
      if (data != undefined) {
        this.user = JSON.parse(data);
        this.user.roles.collection = this.mapToCollection(
          this.user.roles,
          "name"
        );
      }
      this.resolve(this.user);
    });
  }

  saveData() {
    this.storage.set("username", this.username);
    this.storage.set("password", this.password);
    this.storage.set("url", this.url);
  }

  saveUser(user) {
    this.storage.set("user", JSON.stringify(user));
  }

  doLogin() {
    return new Promise((resolve, reject) => {
      this.http
        .get(this.url + "api/login", { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(
          data => {
            data.roles.collection = this.mapToCollection(data.roles, "name");
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  load(resource, saveAs = null) {
    if (!saveAs) {
      saveAs = resource;
    }
    console.time("load " + saveAs);
    return new Promise((resolve, reject) => {
      if (this.objects[saveAs]) {
        this.objects[saveAs].promise
          .then(resp => {
            resolve(resp);
            console.timeEnd("load " + saveAs);
          })
          .catch(reject);
        return;
      }
      this.storage.get(saveAs + "_resource").then(data => {
        this.objects[saveAs] = [];
        if (data) {
          this.objects[saveAs] = data;
        }
        var promise;
        this.objects[saveAs].promise = promise = this.get(resource);
        this.objects[saveAs].promise
          .then(resp => {
            this.objects[saveAs] = resp;
            this.objects[saveAs].promise = promise;
            this.objects[saveAs].collection = this.mapToCollection(resp);
            this.storage.set(saveAs + "_resource", resp);
            console.timeEnd("load " + saveAs);
            return resolve(this.objects[saveAs]);
          })
          .catch(err => {
            reject(err);
            this.Error(err);
          });
      });
    });
  }

  get(uri) {
    return new Promise((resolve, reject) => {
      this.http
        .get(this.url + "api/" + uri, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  post(uri, data) {
    return new Promise((resolve, reject) => {
      this.http
        .post(this.url + "api/" + uri, data, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  put(uri, data) {
    return new Promise((resolve, reject) => {
      this.http
        .put(this.url + "api/" + uri, data, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  delete(uri) {
    return new Promise((resolve, reject) => {
      this.http
        .delete(this.url + "api/" + uri, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  panic() {
    var data = {
      user: this.user,
      location: null
    };
    var promise = this.post("panic", data);
    promise
      .then(data => {
        console.log("panic sent:", data);
        this.toast
          .create({
            message: "panico enviado",
            duration: 5000,
            position: "top"
          })
          .present();

        this.getLocationForPanic(data);
      })
      .catch(err => {
        console.error(err);
        this.toast
          .create({
            message: "Error enviado el panico",
            duration: 5000,
            position: "top"
          })
          .present();
      });
    return promise;
  }

  getLocationForPanic(data) {
    navigator.geolocation.getCurrentPosition(
      resp => {
        var locs = {
          accuracy: resp.coords.accuracy,
          altitude: resp.coords.altitude,
          latitude: resp.coords.latitude,
          longitude: resp.coords.longitude,
          speed: resp.coords.speed,
          heading: resp.coords.heading,
          altitudeAccuracy: resp.coords.altitudeAccuracy,
          timestamp: resp.timestamp
        };
        this.put("panics/" + data.id, { location: locs })
          .then(dataL => {
            console.log("panic with locs", dataL);
          })
          .catch(err => {
            console.error("error sending panic with location", err);
          });
      },
      console.error,
      {
        enableHighAccuracy: true
      }
    );
  }

  Error(error) {
    console.error(error);
    var message = "";
    if (error.status == 500) {
      message = "Internal Server Error";
    }
    if (error.status == 404) {
      message = ".Not Encontrado";
    }
    if (error.status == 401) {
      message = "No Autorizado";
    }
    this.alert
      .create({
        title: "Error en la Red",
        subTitle: error.error,
        message: message + ":" + error.statusText,
        buttons: ["OK"]
      })
      .present();
  }

  startEcho() {
    this.ready.then(() => {
      if (this.Echo) {
        console.warn("already started Echo");
        this.stopEcho();
      }
      console.log("echo to:", this.user.hostEcho);
      this.Echo = new Echo({
        key: "807bbfb3ca20f7bb886e",
        authEndpoint: this.url + "broadcasting/auth",
        broadcaster: "socket.io",
        host: this.user.hostEcho,
        // encrypted: false,
        // cluster: 'eu',
        auth: {
          headers: {
            "Auth-Token": this.user.token,
            Authorization: "Basic " + btoa(this.username + ":" + this.password)
          }
        }
      });
      this.Echo.private("Application")
        .listen("LocationCreated", data => {
          console.log("created location:", data);
          this.zone.run(() => {
            if (
              this.objects.users_tracks &&
              this.objects.users_tracks.collection[data.user.id]
            ) {
              this.objects.users_tracks.collection[data.user.id].location =
                data.location.location;
              this.objects.users_tracks.collection[
                data.user.id
              ].location.timestamp = data.timestamp;
              this.objects.users_tracks.collection[
                data.user.id
              ].updated_at = new Date();
              this.events.publish("LocationCreated", data);
            }
          });
        })
        .listen("ActivityCreated", data => {
          console.log("created activity:", data);
          this.zone.run(() => {
            if (
              this.objects.users_tracks &&
              this.objects.users_tracks.collection[data.user.id]
            ) {
              this.objects.users_tracks.collection[data.user.id].activity =
                data.activity;
              this.events.publish("ActivityCreated", data);
            }
          });
        })

        .listen("Panic", data => {
          console.log("Panic ", data);
          this.handlePanic(data);
        })
        .listen("PanicUpdate", data => {
          console.log("PanicUpdate", data);
          if (this.sound) {
            this.sound.pause();
          }
          this.handlePanic(data, false);
        });

      this.Echo.join("App.Mobile")
        .here(data => {
          this.objects.users_online = data;
          this.objects.users_online.collection = this.mapToCollection(
            data,
            "id"
          );
          console.log("here:", data);
        })
        .joining(data => {
          this.objects.users_online.push(data);
          this.objects.users_online.collection[data.id] = data;
          console.log("joining", data);
        })
        .leaving(data => {
          var u_index = this.objects.users_online.findIndex(u => {
            return u.id == data.id;
          });
          if (u_index) {
            this.objects.users_online.splice(u_index, 1);
            delete this.objects.users_online.collection[data.id];
          }
          console.log("leaving", data);
        });
    });
  }

  stopEcho() {
    this.Echo.leave("Application");
    this.Echo.leave("App.User." + this.user.id);
    this.Echo.leave("App.Residence." + this.user.residence_id);
    this.Echo.leave("App.Mobile");
    this.Echo = undefined;
  }

  playSoundSOS() {
    this.sound = new Audio("assets/sounds/sos.mp3");
    this.sound.play();
    try {
      this.vibration.vibrate([
        300,
        200,
        300,
        200,
        300,
        200,
        300,
        300,
        200,
        300,
        200,
        300,
        200,
        300,
        200
      ]);
    } catch (error) {
      navigator.vibrate([
        300,
        200,
        300,
        200,
        300,
        200,
        300,
        300,
        200,
        300,
        200,
        300,
        200,
        300,
        200
      ]);
    }
    return this.sound;
  }

  public reverseGeo(lat, lon) {
    return new Promise((resolve, reject) => {
      if (this.addresses[lat + "+" + lon]) {
        resolve(this.addresses[lat + "+" + lon]);
      } else {
        this.http
          .get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            {}
          )
          .map(res => res.json())
          .subscribe(
            data => {
              this.addresses[lat + "+" + lon] = data;
              resolve(data);
            },
            error => {
              return reject(error);
            }
          );
      }
    });
  }

  private handlePanic(data, open = true) {
    if (this.setting.panics) {
      this.events.publish("panic", data);
      data.sound = this.playSoundSOS();
      if (open == true) {
        this.backgroundmode.moveToForeground();
        this.backgroundmode.wakeUp();
        var modal = this.modal.create("PanicPage", data);
        modal.present();
      }
    }
    try {
      this.vibration.vibrate([
        300,
        200,
        300,
        200,
        300,
        200,
        300,
        300,
        200,
        300,
        200,
        300,
        200,
        300,
        200
      ]);
    } catch (error) {
      navigator.vibrate([
        300,
        200,
        300,
        200,
        300,
        200,
        300,
        300,
        200,
        300,
        200,
        300,
        200,
        300,
        200
      ]);
    }
  }

  private setHeaders() {
    let headers = new Headers();
    // console.log(this.username, this.password);
    headers.append(
      "Authorization",
      "Basic " + btoa(this.username + ":" + this.password)
    );
    return headers;
  }

  private mapToCollection(array, key = "id") {
    var collection = {};
    array.forEach(element => {
      collection[element[key]] = element;
    });
    return collection;
  }
}
