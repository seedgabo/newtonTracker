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
  locationCreatedHandler = (data) => {
    this.markerUser(data.user, data.location.location);
  }
  constructor(public navCtrl: NavController, public navParams: NavParams, public events: Events, public alert: AlertController, public api: Api, public bg: BgProvider) {
    events.subscribe('LocationCreated', this.locationCreatedHandler)
  }

  ionViewDidLoad() {
    setTimeout(() => {
      this.initMap();
      this.getUsers();
    }, 100)
  }

  ionViewWillUnload(){
    this.map.remove()
    this.cluster.remove()
    this.events.unsubscribe('LocationCreated', this.locationCreatedHandler)
  }

  filter() {
    var result
    if (this.query == "") {
      result = this.api.objects.users
    }
    else{
      var finder = this.query.toLowerCase();
      result = this.api.objects.users.filter((u) => {
        return u.full_name.toLowerCase().indexOf(finder) > -1;
      })
    }
    this.users = result.sort((a,b)=>{
       return a.updated_at - b.updated_at
    })
  }

  initMap() {
    this.map = L.map('mapid', { zoomControl: false }).setView([4.669988, -74.0673856], 13);
    L.tileLayer('https://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}', {
      attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    // L.tileLayer('https://api.tiles.mapbox.com/v4/MapID/997/256/{z}/{x}/{y}.png?access_token={accessToken}', {
    //   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    //   maxZoom: 18
    // }).addTo(this.map);

    // L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    //   attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    // }).addTo(this.map);


    //  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    //   attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    // }).addTo(this.map);


    this.map.addLayer(this.cluster);
  }


  getUsers() {
    this.api.load('users?order[updated_at]=desc')
      .then((users: any) => {
        this.users = users;
        users.forEach(u => {
          console.log(u)
          if (u.location)
            this.markerUser(u, u.location);
        });
        this.map.fitBounds(this.cluster.getBounds(), { padding: [20,20] })
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

  markerUser(user, loc, pan = true, panic=false) {
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
        <img src="${user.imagen}"  class="user-img-icon ${panic?'pulse':'online'}"/>
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
