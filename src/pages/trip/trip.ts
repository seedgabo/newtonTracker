import { BgProvider } from './../../providers/bg/bg';
import { MapProvider } from './../../providers/map/map';
import { Api } from '../../providers/Api';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import * as moment from 'moment';
import Split from 'split.js'

moment.locale('es-us')
declare var L: any;
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
  markers = []
  trip: any = {};
  trip_path
  map
  split
  collapseTo = 'map'
  scrolling = false
  constructor(public navCtrl: NavController, public navParams: NavParams, public api: Api, public Map: MapProvider, public bg: BgProvider) {
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
    try {
      this.map = this.Map.addMap('trip-map');
      this.split = Split(['#trip-map', '#trip-info'], {
        direction: 'vertical',
        sizes: [40, 60],
        minSize: 50,
        gutterSize: 0,
        onDragEnd: () => { this.map.invalidateSize() }
      });
    } catch (error) {
      setTimeout(() => { this.ionViewDidLoad() }, 100);
    }
  }

  ionViewWillUnload() {
    this.map.remove()
  }

  toggle(scrolling) {
    if (scrolling) {
      this.scrolling = true
      setTimeout(() => {
        this.scrolling = false
      }, 300);
    }
    if (this.collapseTo == 'map') {
      this.collapseToInfo()
      this.collapseTo = 'info'
    } else {
      this.collapseToMap()
      this.collapseTo = 'map'
    }
  }

  collapseToMap() {
    this.split.setSizes([30, 70])
    setTimeout(() => {
      this.map.invalidateSize()
    }, 305);
  }

  collapseToInfo() {
    this.split.setSizes([91, 9])
    setTimeout(() => {
      this.map.invalidateSize()
    }, 305);
  }





  getTrip(tripId) {
    this.api.ready.then(() => {
      this.api.get(`trips/${tripId}?with[]=user.entidad&with[]=cliente&with[]=locations`)
        .then((data: any) => {
          this.trip = data
          this.drawTrip(data.locations)
        })
        .catch((err) => {
          this.api.Error(err)
        })
    });

  }

  drawTrip(locations, options: any = { weight: 5, opacity: 1.0, smoothFactor: 1, className: 'trip-path' }) {
    var events = [], toDraw = [], ev
    var previousloc = locations[0]
    locations.forEach(loc => {
      var dist = 0;
      if (previousloc)
        dist = Math.abs(this.bg.getDistanceFromLatLon(loc.location.latitude, loc.location.longitude, previousloc.location.latitude, previousloc.location.longitude));
      if (dist < 200) {
        events[events.length] = ev = new L.LatLng(loc.location.latitude, loc.location.longitude);
        toDraw[toDraw.length] = { loc: loc, ev: ev }
      }
      previousloc = loc
    })
    if (this.trip_path) {
      this.trip_path.remove()
      this.trip_path = null;
    }
    this.trip_path = new L.Polyline(events, options)
    this.trip_path.addTo(this.map)
    this.drawPoints(this.reducePoints(toDraw))
    this.fitPath()
  }

  drawPoints(toDraw) {
    this.markers.forEach((marker) => {
      this.map.removeLayer(marker)
    })
    this.markers = []
    toDraw.forEach((point, index) => {
      setTimeout(() => {
        this.addMarker(point.loc, point.ev)
      }, 50 * index);
    })
  }

  reducePoints(points) {
    if (points.length > 100) {
      var filtered = [];
      for (let index = 1; index < points.length; index += 2) {
        filtered[filtered.length] = points[index];

      }
      return this.reducePoints(filtered)
    }
    return points;
  }

  addMarker(loc, latLng) {
    var icon = L.divIcon({ className: 'position-icon-container', html: `<div class="position-icon" > </div>` })

    var marker = new L.marker(latLng, { icon: icon })
    this.markers[this.markers.length] = marker
    marker.addTo(this.map)
    marker.on("click", () => {
      var popup = L.popup().setLatLng(latLng).setContent(this.htmlPopup(loc)).openOn(this.map);
      this.addAddressPopup(loc, popup)
    })
  }

  fitPath() {
    this.map.fitBounds(this.trip_path.getBounds(), { animate: true, padding: [10, 10] })
  }

  htmlPopup(loc, address = null) {
    console.log(loc)
    return `
     Velocidad: ${Math.floor(loc.location.speed * 3.6)} Kmh  
     <i class="fa fa-arrow-up" style="transform:rotate(${loc.location.heading}deg)"></i>
     <br>
      ${address ? "Direccion: " + address + "<br>" : ''}
    <small style="float:right;text-transform:capitalize">
      ${moment.utc(loc.timestamp).local().calendar()}
    </small>
    <br/>
    <div style="text-align:center">
      <small>
        ${loc.location.latitude}, ${loc.location.longitude}
      </small>
    </div>
    `
  }

  addAddressPopup(loc, popup) {
    this.api.reverseGeo(loc.location.latitude, loc.location.longitude)
      .then((results: any) => {
        popup.setContent(this.htmlPopup(loc, results.display_name))
      })
      .catch((err) => {
        console.error(err)
      })
  }

}
