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
        console.log(ev)
        this.postLocation(ev);

      }
      var onProvider = (ev) => {
        this.provider = ev
      }

      this.bg.on('location', onlocation, this.onLocationFailure);
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
      notificationColor: "#552533FF"
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
    this.api.post("locations", {
      location: loc.coords,
      user_id: this.api.user.id,
      timestamp: loc.timestamp,
      extra: {
        is_moving: loc.is_moving,
        battery: loc.battery,
        activity: loc.activity
      }
    })
      .then((resp) => {
        console.log(resp)
      })
      .catch((err) => {
        console.error(err)
      })
  }

  onLocationFailure(err) {
    console.error(err)
  }

}
