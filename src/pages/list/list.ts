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

  ionViewWillUnload(){
    this.map.remove()
    this.cluster.remove()
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
    L.tileLayer('https://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}', {
      attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    //  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    //   attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    // });

    // L.tileLayer('https://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/hybrid.day/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}', {
    //   attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    //   subdomains: '1234',
    //   mapID: 'newest',
    //   app_id: '<your app_id>',
    //   app_code: '<your app_code>',
    //   base: 'aerial',
    //   maxZoom: 20,
    //   type: 'maptile',
    //   language: 'eng',
    //   format: 'png8',
    //   size: '256'
    // });

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
