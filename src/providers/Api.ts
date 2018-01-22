import { Events, AlertController, ToastController } from 'ionic-angular';
import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
// import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';
import { Storage } from '@ionic/storage';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { NgZone } from '@angular/core';

declare var window: any;
window.Pusher = Pusher;

// import moment from 'moment';
// moment.locale('es');
@Injectable()
export class Api {
  username: string;
  password: string;
  token: string;
  url: string = 'http://newton.eycproveedores.com/newton/public/';
  user: any = null;
  ready = new Promise((resolve, reject) => {
    this.resolve = resolve;
  })
  resolve;
  Echo;
  objects: any = {};
  constructor(public http: Http, public storage: Storage, public events: Events, public zone: NgZone, public alert: AlertController, public toast: ToastController) {
    this.initVar();
    window.$api = this;
  }

  initVar() {
    this.storage.get("username").then((data) => data != undefined ? this.username = data : '');
    this.storage.get("password").then((data) => data != undefined ? this.password = data : '');
    this.storage.get("user").then((data) => {
      data != undefined ? this.user = JSON.parse(data) : null;
      this.resolve(this.user);
    });
  }

  saveData() {
    this.storage.set("username", this.username);
    this.storage.set("password", this.password);
    this.storage.set("url", this.url);
  };

  saveUser(user) {
    this.storage.set("user", JSON.stringify(user));
  }

  doLogin() {
    return new Promise((resolve, reject) => {
      this.http.get(this.url + "api/login", { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(data => {
          resolve(data);
        }, error => {
          return reject(this.handleData(error));
        });
    });
  }

  load(resource, query = "") {
    console.time("load " + resource)
    return new Promise((resolve, reject) => {
      if (this.objects[resource]) {
        this.objects[resource].promise
          .then((resp) => {

            resolve(resp);
            console.timeEnd("load " + resource)
          })
          .catch(reject)
        return
      }
      this.storage.get(resource + "_resource")
        .then((data) => {
          this.objects[resource] = []
          if (data) {
            this.objects[resource] = data;
          }
          var promise;
          this.objects[resource].promise = promise = this.get(resource + query)
          this.objects[resource].promise.then((resp) => {
            this.objects[resource] = resp;
            this.objects[resource].promise = promise;
            this.objects[resource].collection = this.mapToCollection(resp);
            this.storage.set(resource + "_resource", resp);
            console.timeEnd("load " + resource)
            return resolve(this.objects[resource]);
          })
            .catch((err) => {
              reject(err);
              this.Error(err)
            })
        })
    })
  }

  get(uri) {
    return new Promise((resolve, reject) => {
      this.http.get(this.url + "api/" + uri, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(data => {
          resolve(data);
        }, error => {
          return reject(this.handleData(error));
        });
    });
  }

  post(uri, data) {
    return new Promise((resolve, reject) => {
      this.http.post(this.url + "api/" + uri, data, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(data => {
          resolve(data);
        }, error => {
          return reject(this.handleData(error));
        });
    });
  }

  put(uri, data) {
    return new Promise((resolve, reject) => {
      this.http.put(this.url + "api/" + uri, data, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(data => {
          resolve(data);
        }, error => {
          return reject(this.handleData(error));
        });
    });
  }

  delete(uri) {
    return new Promise((resolve, reject) => {
      this.http.delete(this.url + "api/" + uri, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(data => {
          resolve(data);
        }, error => {
          return reject(this.handleData(error));
        });
    });
  }

  panic() {
    var data = {
      user: this.user,
      location: null,
    }
    var promise = this.post('panic', data)
    promise
      .then((data) => {
        console.log("panic sent:", data)
        this.toast.create({
          message: ("panico enviado"),
          duration: 5000,
          position: 'top',
        }).present();

        this.getLocationForPanic(data);
      })
      .catch((err) => {
        console.error(err)
        this.toast.create({
          message: "Error enviado el panico",
          duration: 5000,
          position: 'top',
        }).present();

      })
    return promise;
  }

  getLocationForPanic(data) {
    navigator.geolocation.getCurrentPosition((resp) => {
      var locs = {
        accuracy: resp.coords.accuracy,
        altitude: resp.coords.altitude,
        latitude: resp.coords.latitude,
        longitude: resp.coords.longitude,
        speed: resp.coords.speed,
        heading: resp.coords.heading,
        altitudeAccuracy: resp.coords.altitudeAccuracy,
        timestamp: resp.timestamp,
      }
      this.put("panics/" + data.id, { location: locs })
        .then((dataL) => {
          console.log("panic with locs", dataL)
        })
        .catch((err) => {
          console.error("error sending panic with location", err);
        })

    }, console.error, {
        enableHighAccuracy: true,
      })
  }

  Error(error) {
    console.error(error)
    var message = "";
    if (error.status == 500) {
      message = "Internal Server Error"
    }
    if (error.status == 404) {
      message = ".Not Encontrado"
    }
    if (error.status == 401) {
      message = "No Autorizado"
    }
    this.alert.create({
      title: "Error en la Red",
      subTitle: error.error,
      message: message + ":" + error.statusText,
      buttons: ["OK"],

    }).present();
  }

  startEcho() {
    this.ready.then(() => {
      if (this.Echo) {
        console.warn('already started Echo');
        this.stopEcho()
      }
      console.log("echo to:", this.user.hostEcho);
      this.Echo = new Echo({
        key: '807bbfb3ca20f7bb886e',
        authEndpoint: this.url + 'broadcasting/auth',
        broadcaster: 'socket.io',
        host: this.user.hostEcho,
        // encrypted: false,
        // cluster: 'eu',
        auth:
          {
            headers:
              {
                'Auth-Token': this.user.token,
                'Authorization': "Basic " + btoa(this.username + ":" + this.password)
              }
          }

      });
      this.Echo.private('Application')
        .listen('LocationCreated', (data) => {
          console.log("created location:", data);
          this.zone.run(() => {
            if (this.objects.users) {
              this.objects.users.collection[data.user.id].location = data.location.location;
              this.objects.users.collection[data.user.id].updated_at = new Date();
            }
            this.events.publish('LocationCreated', data)
          })
        })


        .listen('Panic', (data) => {
          console.log("Panic ", data);
          this.zone.run(() => {
            this.events.publish('Panic', data)
          })
        })

    })
  }

  stopEcho() {
    this.Echo.leave('Application');
    this.Echo.leave('App.User.' + this.user.id);
    this.Echo.leave('App.Residence.' + this.user.residence_id);
    this.Echo.leave('App.Mobile');
    this.Echo = undefined;
  }

  private setHeaders() {
    let headers = new Headers();
    // console.log(this.username, this.password);
    headers.append("Authorization", "Basic " + btoa(this.username + ":" + this.password));
    return headers;
  }

  private handleData(res) {
    if (res.statusText == "Ok") {
      return { status: "No Parace haber conexión con el servidor" };
    }

    // If request fails, throw an Error that will be caught
    if (res.status < 200 || res.status >= 300) {
      return { error: res.status }
    }
    // If everything went fine, return the response
    else {
      return res;
    }
  }

  private mapToCollection(array, key = "id") {
    var collection = {}
    array.forEach(element => {
      collection[element[key]] = element
    });
    return collection;
  }



}
