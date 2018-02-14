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
  current_activity = ""

  trip_data = {
    trip_timestamp: moment(),
    reference_ev: null,
    on_trip: false,
    timestamp: null,
    start_location: null,
    stop_location: null,
    locations: 0,
    time_track: 1000 * 10 * 60,
    time_track_stop: 1000 * 6 * 60,
    events_to_init_trip: 7,
  }

  trip_metrics = {
    avg_speed: 0,
    max_speed: 0,
    _ev_max_speed: null,
    distance: 0,
    duration: 0,
    event_counter: 0,
    avg_altitude: 0,
    max_altitude: 0,
    _ev_max_altitude: null,
    _sum_speed: 0,
    _sum_altitude: 0,
    _first_event_time: moment.utc().toDate()
  }
  last_location
  tries = 0
  constructor(public http: Http, public platform: Platform, public api: Api, public zone: NgZone) {
    window.$bg = this;
    this.configurate()
    this.loadVariables()
  }

  loadVariables() {
    this.api.storage.get("trip_metrics")
      .then((trip_metrics) => {
        if (trip_metrics) {
          this.trip_metrics = JSON.parse(trip_metrics)
        }
        this.api.storage.get('trips')
          .then((trips) => {
            if (trips) {
              this.trip_data = JSON.parse(trips)
              if (Math.abs(moment.utc().diff(moment.utc(this.trip_data.trip_timestamp), "minutes")) > 10) {
                this.locate().then((loc) => {
                  this.stopTrip(loc)
                })
              }
            }
          })
      })
  }

  configurate() {
    this.platform.ready().then(() => {
      this.bg = (<any>window).BackgroundGeolocation;
      if (!this.bg) {
        return
      }

      var onlocation = (ev) => {
        console.log("on Location", ev)
        this.zone.run(() => {
          this.TripAlgorithm(ev)
          if (!this.isValidPoint(ev)) {
            this.last_location = ev;
            this.locations.push(ev)
          }
        })
      }

      var onHttp = (ev) => {
        console.log("location posted", ev)
      }

      var onProvider = (ev) => {
        this.provider = ev
      }

      var onActivity = (activity) => {
        console.log("on actitivty", activity)
        if (this.current_activity != activity.activity && activity.confidence > 90) {
          this.current_activity = activity.activity
          this.postActivity(activity);
        }
      }


      this.bg.on('location', onlocation, this.onLocationFailure);
      this.bg.on('activitychange', onActivity, this.onLocationFailure);
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
      debug: false,
      stopOnTerminate: false,
      startOnBoot: true,
      forceReloadOnBoot: true,
      preventSuspend: true,
      foregroundService: true,
      minimumActivityRecognitionConfidence: 90,
      notificationIcon: "drawable/logo",
      notificationTitle: "Newton Tracker",
      notificationText: "Sevicio de Rastreo Activado",
      notificationColor: "#048ef7",
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

      if (!this.isValidPoint(location)) {
        var dist = this.getDistanceFromLatLon(location.coords.latitude, location.coords.longitude, this.trip_data.reference_ev.coords.latitude, this.trip_data.reference_ev.coords.longitude);
        this.trip_data.locations++;
      }

      // Init the trip
      if (this.trip_data.locations >= this.trip_data.events_to_init_trip && dist > 200) {
        this.startTrip(location);
      }

      this.api.storage.set("trips", JSON.stringify(this.trip_data));
    }
    // on trip
    else if (this.trip_data.on_trip) {
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

      this.api.storage.set("trips", JSON.stringify(this.trip_data));
    }

    this.tripMetrics(location)

    return this.trip_data.on_trip

  }

  startTrip(location) {
    this.trip_data.trip_timestamp = moment.utc()
    this.trip_data.on_trip = true;
    this.trip_data.start_location = location
    this.trip_data.stop_location = null
    this.postStartTrip()
    this.clearTripMetrics()
  }

  stopTrip(location) {
    this.trip_data.trip_timestamp = moment.utc()
    this.trip_data.on_trip = false;
    this.trip_data.stop_location = location
    this.postStopTrip()
    this.clearTripMetrics()
  }

  private stopTimeoutTrip() {
    try {
      if (this.timeout_track) {
        clearTimeout(this.timeout_track);
        this.timeout_track = undefined
      }

    } catch (e) { console.warn(e) }
  }

  private tripMetrics(location) {
    console.log("trip_data:", this.trip_data)

    // If the event is has a location
    if (location.coords != undefined) {

      if (location.coords.speed != -1) { // if location has speed and altitude

        this.trip_metrics.event_counter++; // counting events with speed and altitude

        // Calculating average speed and altitude
        this.trip_metrics._sum_speed += location.coords.speed;
        this.trip_metrics.avg_speed = this.trip_metrics._sum_speed / this.trip_metrics.event_counter;


        this.trip_metrics._sum_altitude += location.coords.alttiude;
        this.trip_metrics.avg_altitude = this.trip_metrics._sum_altitude / this.trip_metrics.event_counter;

      }

      //  Distance  of the trip
      if (this.last_location != undefined && this.last_location.coords != undefined) {
        this.trip_metrics.distance += this.getDistanceFromLatLon(
          this.last_location.coords.latitude, this.last_location.coords.longitude,
          location.coords.latitude, location.coords.longitude
        );
      }

      if (location.coords.speed > this.trip_metrics.max_speed) {
        this.trip_metrics.max_speed = location.coords.speed;
        this.trip_metrics._ev_max_speed = location;
      }

      if (location.coords.altitude > this.trip_metrics.max_altitude) {
        this.trip_metrics.max_altitude = location.coords.altitude;
        this.trip_metrics._ev_max_altitude = location;
      }

    }
    if (this.trip_metrics._first_event_time) {
      this.trip_metrics.duration = moment.utc().diff(this.trip_metrics._first_event_time, "seconds");
    }
    this.api.storage.set("trip_metrics", JSON.stringify(this.trip_metrics))

  }

  private clearTripMetrics() {
    this.trip_metrics = {
      avg_speed: 0,
      max_speed: 0,
      _ev_max_speed: null,
      distance: 0,
      duration: 0,
      event_counter: 0,
      avg_altitude: 0,
      max_altitude: 0,
      _ev_max_altitude: null,
      _sum_speed: 0,
      _sum_altitude: 0,
      _first_event_time: moment.utc().toDate()
    }
    this.api.storage.set("trip_metrics", JSON.stringify(this.trip_metrics))
  }

  private isValidPoint(loc) {
    var last_point = this.last_location;
    if (!last_point) { return true }
    if (loc.coords.accuracy > 60) { return false }
    if (this.tries > 3) { this.tries = 0; return true; }

    var distance = this.getDistanceFromLatLon(loc.coords.latitude, loc.coords.longitude, last_point.coords.latitude, last_point.coords.longitude);
    var time = moment.utc(loc.timestamp).diff(moment.utc(last_point.timestamp), "seconds");
    loc.distance_between_last_point = distance;

    if (last_point.coords.speed > 0 && (last_point.coords.speed / distance * time > 3)) {
      this.tries++;
      return false;
    }
    else if (distance > 1000) {
      this.tries++;
      return false;
    }
    this.tries = 0;
    return true;
  }


  // API

  postStartTrip(data = null) {
    if (!data) {
      data = {
        user_id: this.api.user.id,
        entidad_id: this.api.user.entidad_id,
        cliente_id: this.api.user.cliente_id,
        start: moment().format('YYYY-MM-DD hh:mm:ss'),
        end: null,
        extra: this.trip_metrics
      }
    }
    this.api.post('trips', data)
      .then((data) => {
        console.log("trip posted", data)
      })
      .catch((err) => {
        console.error(err)
        setTimeout(() => {
          this.postStartTrip(data)
        }, 1000 * 60);
      })
  }

  postStopTrip(data = null) {
    if (!data) {
      data = {
        user_id: this.api.user.id,
        entidad_id: this.api.user.entidad_id,
        cliente_id: this.api.user.cliente_id,
        start: moment.utc(this.trip_metrics._first_event_time).format('YYYY-MM-DD hh:mm:ss'),
        end: moment().format('YYYY-MM-DD hh:mm:ss'),
        extra: this.trip_metrics
      }
    }
    this.api.post('trips', data)
      .then((data) => {
        console.log("trip posted", data)
      })
      .catch((err) => {
        console.error(err)
        setTimeout(() => {
          this.postStopTrip(data)
        }, 1000 * 30);
      })
  }

  postActivity(event) {
    var data = {
      user_id: this.api.user.id,
      entidad_id: this.api.user.entidad_id,
      cliente_id: this.api.user.cliente_id,
      timestamp: moment().format('YYYY-MM-DD hh:mm:ss'),
      activity: event.activity,
      confidence: event.confidence
    }
    this.api.post('activities', data)
      .then((data) => {
        console.log("activities posted", data)
      })
      .catch((err) => {
        console.error(err)
        setTimeout(() => {
          this.postActivity(event)
        }, 1000 * 60);
      })
  }



  locate() {
    return new Promise((resolve, reject) => {
      this.bg.getCurrentPosition((pos) => {
        resolve(pos)
        this.postLocation(pos)
      }, (err) => {
        reject(err)
      })
    })
  }

  postLocation(loc) {
    loc.user_id = this.api.user.id
    var promise = this.api.post("locations/tracker", loc)
    promise.then((resp) => { console.log(resp) })
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
