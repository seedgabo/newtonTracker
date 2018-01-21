import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { BgProvider } from '../../providers/bg/bg';
import { Events } from 'ionic-angular';
import * as moment from 'moment';
moment.locale('es');
declare var L: any;
declare var LatLng: any;
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  map
  markers = {}
  users = [];
  query = "";
  constructor(public navCtrl: NavController, public api: Api, public bg: BgProvider, public alert: AlertController, public events: Events) {
    events.subscribe('LocationCreated', (data) => {
      this.markerUser(data.user, data.location.location);
    })
  }

  ionViewDidLoad() {
    this.api.startEcho();
    this.initMap();
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
    this.map = L.map('mapid').setView([47.7121724, -122.3246066], 13);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.getDefaultLocation()
  }

  getUsers() {
    this.api.load('users')
      .then((users: any) => {
        this.users = users;
        users.forEach(u => {
          if (u.location)
            this.markerUser(u, u.location);
        });
      })
      .catch(this.api.Error);
  }

  start() {
    this.bg.startTrack();
  }

  stop() {
    this.bg.stopTrack();
  }

  locate() {
    this.bg.locate()
      .then((pos) => {
      })
  }

  centerInUser(user) {
    var loc = user.location
    if (loc)
      this.map.panTo(new L.LatLng(loc.latitude, loc.longitude));

    var popup = L.popup()
      .setLatLng([loc.latitude, loc.longitude])
      .setContent(this.htmlPopup(user))
      .openOn(this.map);
  }

  markerUser(user, loc, pan = true) {
    if (this.markers[user.id]) {
      this.map.removeLayer(this.markers[user.id]);
      if (pan)
        this.map.panTo(new L.LatLng(loc.latitude, loc.longitude));
      this.markers[user.id].addTo(this.map);
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
      this.markers[user.id] = L.marker([loc.latitude, loc.longitude], { icon: icon }).addTo(this.map);

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
    var icon = L.divIcon({
      className: 'user-icon',
      iconSize: [50, 50],
      html: `
        <img src="${this.api.user.imagen}"  class="user-img-icon pulse"/>
        <div class="label-map""><div>
        ${this.api.user.full_name}
        </div></div>
      `
    });

    navigator.geolocation.getCurrentPosition((data) => {
      this.map.panTo(new L.LatLng(data.coords.latitude, data.coords.longitude));
      // var marker = L.marker([data.coords.latitude, data.coords.longitude], { icon: icon }).addTo(this.map);
    })
  }

}
