import { Api } from './../Api';
import { Platform } from 'ionic-angular';
import { Injectable, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import * as moment from 'moment';
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
  locations = [];
  timeout_track;
  trip_data = {
    trip_timestamp:moment.utc(),
    reference_ev:null,
    on_trip : false,
    timestamp: null,
    start_location: null,
    stop_location: null,
    locations: 0,
    time_track: 1000 * 10 * 60,
    time_track_stop: 1000 * 6 * 60,
    events_to_init_trip:7,
  }
  last_location
  constructor(public http: Http, public platform: Platform, public api: Api, public zone: NgZone) {
    window.$bg = this;
    this.configurate()
    this.loadVariables()
  }
  loadVariables(){
    this.api.storage.get('trips')
    .then((trips)=>{
      if(trips){
        this.trip_data = trips
        if(Math.abs(moment.utc().diff(moment.utc(this.trip_data.trip_timestamp,"minutes"))) > 10){
          this.locate().then((loc)=>{
            this.stopTrip(loc)
          })
        }
      }
    })
  }
  
  configurate() {
    this.platform.ready().then(() => {
      this.bg = (<any>window).BackgroundGeolocation;
      if (!this.bg) {
        return
      }
      
      var onlocation = (ev) => {
        console.log("on Location",ev)
        this.zone.run(()=>{
          this.last_location = ev;
          this.locations.push(ev)
          this.TripAlgorithm(ev)
        })
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
      locationTemplate: `{ 
        "user_id": ${this.api.user.id},
        "timestamp":"<%= timestamp %>", 
        "coords":{ 
          "latitude":<%= latitude %>, 
          "longitude":<%= longitude %>, 
          "accuracy":<%= accuracy %>, 
          "speed":<%= speed %>, 
          "heading":<%= heading %>,
          "altitude":<%= altitude %> 
        }
      }`,
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

  TripAlgorithm(location) {


    // in rest, moving
    if (!this.trip_data.on_trip) {
      // If no a first point to reference the initial state of the trip
      if (!this.trip_data.reference_ev) {
        this.trip_data.timestamp = moment.utc();
        this.trip_data.reference_ev = location;
        this.stopTimeoutTrip()

        this.timeout_track = setTimeout(
          () => {
            this.trip_data.timestamp = null;
            this.trip_data.reference_ev = null;
            this.trip_data.locations = 0;
          }, this.trip_data.time_track);
      }

      // If the event distance from reference event is greater than 50 mts
      var dist = this.getDistanceFromLatLon(location.coords.latitude, location.coords.longitude, this.trip_data.reference_ev.coords.latitude, this.trip_data.reference_ev.coords.longitude);
      this.trip_data.locations++;

      // Init the trip
      if (this.trip_data.locations >= this.trip_data.events_to_init_trip && dist > 100) {
        this.startTrip(location);
      }

      this.api.storage.set("trips", this.trip_data);
    }
    // on trip
    else if (this.trip_data.on_trip) {
      // Logger.info("trip: event on trip")
      this.trip_data.locations++;
      this.trip_data.timestamp = moment.utc();
      this.trip_data.reference_ev = location;
      this.stopTimeoutTrip()
      this.timeout_track = setTimeout(
        () => {
          this.stopTrip(location);
          this.trip_data.timestamp = null;
          this.trip_data.reference_ev = null;
          this.trip_data.locations = 0;
        }, this.trip_data.time_track_stop);

      this.api.storage.set("trips", this.trip_data);
    }

    this.tripMetrics()

    return this.trip_data.on_trip

  }

  startTrip(location) {
    this.trip_data.trip_timestamp = moment.utc()
    this.trip_data.on_trip = true;
    this.trip_data.start_location = location
    this.trip_data.stop_location = null
  }
  
  stopTrip(location){
    this.trip_data.trip_timestamp = moment.utc()
    this.trip_data.on_trip = false;
    this.trip_data.stop_location  = location
  }

  private stopTimeoutTrip() {
    try {
      if (this.timeout_track) {
        clearTimeout(this.timeout_track);
        this.timeout_track = undefined
      }

    } catch (e) { console.warn(e) }
  }

  private tripMetrics(){
    console.log("trip_data:", this.trip_data)
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


  getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = this.deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000;  // distance in mts
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180)
  }

}
 