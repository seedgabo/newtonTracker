import { BgProvider } from './../../providers/bg/bg';
import { MapProvider } from './../../providers/map/map';
import { Api } from '../../providers/Api';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import * as moment from 'moment';
moment.locale('es-us')
declare var L:any;
@IonicPage({
  defaultHistory: ["ListPage"],
  segment: "tracking/trip/:tripId"
})
@Component({
  selector: "page-trip",
  templateUrl: "trip.html"
})
export class TripPage {
  trips = [];
  trip: any = {};
  trip_path
  map
  constructor(public navCtrl: NavController, public navParams: NavParams, public api: Api, public Map: MapProvider, public bg:BgProvider) {
    var tripId
    if (this.navParams.get("trips")) {
      this.trips = this.navParams.get("trips");
    }
    if (this.navParams.get("trip")) {
      this.trip = this.navParams.get("trip");
      tripId = this.trip.id
    }
    else if (this.navParams.get("tripId")) {
      tripId = this.navParams.get("tripId");
    }
    this.getTrip(tripId);
  }
  
  ionViewDidLoad() {
    this.map = this.Map.addMap('trip-map');
  }


  getTrip(tripId) {
    this.api.ready.then(() => {
      this.api.get(`trips/${tripId}?with[]=user.entidad&with[]=cliente&with[]=locations`)
        .then((data:any) => {
          this.trip = data  
          this.drawTrip(data.locations)
        })
        .catch((err) => {
          this.api.Error(err)
      })
    });
  
  }

  drawTrip(locations, options: any = { weight: 5, opacity: 1.0, smoothFactor: 1 }) {
    var events = []
    var previousloc = locations[0]
    locations.sort(function (a, b) { return moment.utc(b).diff(moment.utc(a)) }).forEach(loc => {
      var dist = 0;
      if (previousloc)
        dist = Math.abs(this.bg.getDistanceFromLatLon(loc.location.latitude, loc.location.longitude, previousloc.location.latitude, previousloc.location.longitude));
      if (dist < 200) {
        events[events.length] = new L.LatLng(loc.location.latitude, loc.location.longitude);
      }
      previousloc = loc
    })

    if (this.trip_path) {
      this.trip_path.remove()
      this.trip_path = null;
    }

    this.trip_path = new L.Polyline(events, options)
    this.trip_path.addTo(this.map)
    this.map.fitBounds(this.trip_path.getBounds(),{ padding: [50,50]})
  }


}
