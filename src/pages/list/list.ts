import { BgProvider } from './../../providers/bg/bg';
import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController, NavParams, Events, AlertController } from 'ionic-angular';
import * as moment from 'moment';
moment.locale('es');
declare var L: any;
declare var LatLng: any;
@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {
  map
  markers = {}
  users = []
  query = ""
  cluster = L.markerClusterGroup()
  constructor(public navCtrl: NavController, public navParams: NavParams, public events: Events, public alert: AlertController, public api: Api, public bg: BgProvider) {
    events.subscribe('LocationCreated', (data) => {
      this.markerUser(data.user, data.location.location);
    })
  }

  ionViewDidLoad() {
    setTimeout(() => {
      this.initMap();
    }, 100)
    this.getUsers();
  }

  filter() {
    if (this.query == "") {
      return this.users = this.api.objects.users
    }
    var finder = this.query.toLowerCase();
    this.users = this.api.objects.users.filter((u) => {
      return u.full_name.toLowerCase().indexOf(finder) > -1;
    })
  }

  initMap() {
    this.map = L.map('mapid', { zoomControl: false }).setView([47.7121724, -122.3246066], 13);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    this.map.addLayer(this.cluster);
    navigator.geolocation.getCurrentPosition((data) => {
      this.map.panTo(new L.LatLng(data.coords.latitude, data.coords.longitude));
    })
  }


  getUsers() {
    this.api.load('users')
      .then((users: any) => {
        this.users = users;
        users.forEach(u => {
          console.log(u)
          if (u.location)
            this.markerUser(u, u.location);
        });
      })
      .catch(this.api.Error);
  }


  locate() {
    this.getDefaultLocation();

    this.bg.locate().then((pos) => { })
  }

  centerInUser(user) {
    var loc = user.location
    if (loc)
      this.map.panTo(new L.LatLng(loc.latitude, loc.longitude));

    L.popup()
      .setLatLng([loc.latitude, loc.longitude])
      .setContent(this.htmlPopup(user))
      .openOn(this.map);
  }

  markerUser(user, loc, pan = true) {
    if (this.markers[user.id]) {
      this.cluster.removeLayer(this.markers[user.id]);
      if (pan)
        this.map.panTo(new L.LatLng(loc.latitude, loc.longitude));
      this.cluster.addLayer(this.markers[user.id])
      this.cluster.refreshClusters(this.markers[user.id])
    }
    else {
      var icon = L.divIcon({
        className: 'user-icon',
        iconSize: [50, 50],
        html: `
        <img src="${user.imagen}"  class="user-img-icon pulse"/>
          <div class="label-map""><div>
          ${user.full_name}
          </div></div>
          `
      });
      if (pan)
        this.map.panTo(new L.LatLng(loc.latitude, loc.longitude));
      this.markers[user.id] = L.marker([loc.latitude, loc.longitude], { icon: icon });
      this.cluster.addLayer(this.markers[user.id])
      this.cluster.refreshClusters(this.markers[user.id])
      this.markers[user.id].on('click', (ev) => {
        var latlng = this.markers[user.id].getLatLng();
        var popup = L.popup()
          .setLatLng(latlng)
          .setContent(this.htmlPopup(user)).openOn(this.map);
      })
    }
  }

  htmlPopup(user) {
    return `
      <h6> ${user.full_name}</h6>
      <span> ${moment(user.updated_at).format('LLLL')}</span>
      <br>
      <span><b>Departamento:</b>  ${user.departamento}</span>
      <br>
      <span><b>Cargo:</b> ${user.departamento}</>
    `
  }

  getDefaultLocation() {
    navigator.geolocation.getCurrentPosition((data) => {
      this.map.panTo(new L.LatLng(data.coords.latitude, data.coords.longitude));
    })
  }
}
