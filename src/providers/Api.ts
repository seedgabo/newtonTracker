import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
// import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';
import { Storage } from '@ionic/storage';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

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
  constructor(public http: Http, public storage: Storage) {
    this.initVar();
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

}
