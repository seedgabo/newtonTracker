import { Api } from './../Api';
import { Platform } from 'ionic-angular';
import { Injectable, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

declare var window: any;
@Injectable()
export class BgProvider {
  bg;
  provider = {
    network: true,
    gps: true,
    enabled: false,
  };
  config;
  state = false;
  constructor(public http: Http, public platform: Platform, public api: Api, public zone: NgZone) {
    window.$bg = this;
    this.configurate()
  }

  configurate() {
    this.platform.ready().then(() => {
      this.bg = (<any>window).BackgroundGeolocation;
      if (!this.bg) {
        return
      }
      var onlocation = (ev) => {
        console.log("on Location",ev)
        // this.postLocation(ev);
      }
      var onHttp = (ev)=>{
          console.log("location posted", ev)
      }

      var onProvider = (ev) => {
        this.provider = ev
      }


      this.bg.on('location', onlocation, this.onLocationFailure);
      this.bg.on('http', onHttp, this.onLocationFailure);
      this.bg.on('providerchange', onProvider, console.warn);
      this.bg.on('motionchange', console.info);
      this.bg.getState((state) => {
        this.config = state;
        this.state = state.enabled;
      }, console.warn)
    });

  }

  startTrack() {
    if (!this.bg) {
      return this.state = true
    }
    this.bg.configure({
      desiredAccuracy: 0,
      distanceFilter: 50,
      debug: true,
      stopOnTerminate: false,
      startOnBoot: true,
      forceReloadOnBoot: true,
      foregroundService: true,
      notificationTitle: "Newton Tracker",
      notificationText: "Sevicio de Rastreo Activado",
      notificationColor: "#DDDDDD",

      url: this.api.url + "api/locations/tracker",
      params: { user_id: this.api.user.id },
      httpRootProperty: '.',
      locationTemplate: `{ user_id: ${this.api.user.id} ,timestamp: <%= timestamp %>, coords: { latitude: <%= latitude %>, longitude: <%= longitude %>, accuracy: <%= accuracy %>, speed: <%= speed %>, heading: <%= heading %>, altitude: <%= altitude %> }}`,
      headers: { "Authorization": "Basic " + btoa(this.api.username + ":" + this.api.password) },
      method: 'POST',
      autoSync: true,
      maxDaysToPersist: 3,

    }, (state) => {
      this.zone.run(() => {
        this.state = true;
        this.bg.start();
      })
    });
  }

  stopTrack() {
    if (!this.bg) {
      return this.state = false
    }

    if (this.state) {
      this.bg.stop();
      this.state = false;
    }
  }

  locate() {
    return new Promise((resolve, reject) => {
      this.bg.getCurrentPosition((pos) => {
        resolve(pos)
      }, (err) => {
        reject(err)
      })
    })
  }

  postLocation(loc) {
    loc.user_id = this.api.user.id
    var promise = this.api.post("locations/tracker", loc)
    promise .then((resp) => { console.log(resp) })
      .catch((err) => { console.error(err) })

    return promise
  }

  onLocationFailure(err) {
    console.error(err)
  }

}
