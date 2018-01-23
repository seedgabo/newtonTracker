import { BgProvider } from './../../providers/bg/bg';

import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController, NavParams, Events, AlertController } from 'ionic-angular';
import * as moment from 'moment';
moment.locale('es');
declare var L: any;
@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {
  map
  disabled_panic = false;
  markers = {}
  users = []
  query = ""
  cluster = L.markerClusterGroup()
  locationCreatedHandler = (data) => {
    this.markerUser(data.user, data.location.location);
  }
  panicHandler = (data) => {
    if (!data.location) {
      data.location = data.user.location
    }
    this.markerUser(data.user, data.location, true, true);
  }
  constructor(public navCtrl: NavController, public navParams: NavParams, public events: Events, public alert: AlertController, public api: Api, public bg: BgProvider) {
    events.subscribe('LocationCreated', this.locationCreatedHandler)
    events.subscribe('panic', this.panicHandler)
  }

  ionViewDidLoad() {
    setTimeout(() => {
      this.initMap();
      this.getUsers();
    }, 100)
  }

  ionViewWillUnload() {
    this.map.remove()
    this.cluster.remove()
    this.events.unsubscribe('LocationCreated', this.locationCreatedHandler)
    this.events.unsubscribe('panic', this.panicHandler)
  }

  filter() {
    var result
    if (this.query == "") {
      result = this.api.objects.users_tracks
    }
    else {
      var finder = this.query.toLowerCase().trim();
      result = this.api.objects.users_tracks.filter((u) => {
        return u.full_name.toLowerCase().indexOf(finder) > -1
          || (u.entidad && u.entidad.name.toLowerCase().indexOf(finder) > -1)
      })
    }
    this.users = result;
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
    var entidades_ids = this.pluck(this.api.user.entidades, 'id')
    this.api.load(`users?whereIn[entidad_id]=${entidades_ids.join()}&with[]=entidad&order[updated_at]=desc`, 'users_tracks')
      .then((users: any) => {
        this.users = users;
        users.forEach(u => {
          // console.log(u)
          if (u.location)
            this.markerUser(u, u.location);
        });
        this.fitToAll()

      })
      .catch(this.api.Error);
  }




  locate() {
    this.getDefaultLocation();
    if (this.bg.bg)
      this.bg.locate().then((pos) => { })
  }

  sos() {
    this.disabled_panic = true;
    this.api.panic()
      .then(() => {
        this.disabled_panic = false;
      })
      .catch(() => {
        this.disabled_panic = false;
      });
  }


  fitToAll() {
    this.map.fitBounds(this.cluster.getBounds(), { padding: [20, 20] })
  }

  centerInUser(user) {
    var loc = user.location
    if (loc)
      this.map.panTo([loc.latitude, loc.longitude]);

    L.popup()
      .setLatLng([loc.latitude, loc.longitude])
      .setContent(this.htmlPopup(user))
      .openOn(this.map);
  }

  markerUser(user, loc, pan = true, panic = false) {
    if (this.markers[user.id]) {
      this.cluster.removeLayer(this.markers[user.id]);
      delete (this.markers[user.id])
    }
    var icon = L.divIcon({
      className: 'user-icon',
      iconSize: [50, 50],
      html: `
      <img src="${user.imagen}"  class="user-img-icon ${panic ? 'pulse' : 'online'}"/>
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
      L.popup()
        .setLatLng(latlng)
        .setContent(this.htmlPopup(user)).openOn(this.map);
    })
  }

  htmlPopup(user) {
    return `
      <h6> ${user.full_name}</h6>
      <span> ${moment(user.location.timestamp).format('LLLL')}</span>
      <br>
      <span><b>Cargo:</b> ${user.cargo}</>
      <br>
      <span><b>Departamento:</b>  ${user.departamento}</span>
    `
  }

  getDefaultLocation() {
    navigator.geolocation.getCurrentPosition((data) => {
      this.map.panTo(new L.LatLng(data.coords.latitude, data.coords.longitude));
    })
  }


  private pluck(array, key) {
    var resp = []
    array.forEach(element => {
      resp[resp.length] = element[key]
    });
    return resp
  }
}
