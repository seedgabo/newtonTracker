import { BgProvider } from './../../providers/bg/bg';

import { Api } from './../../providers/Api';
import { Component } from '@angular/core';
import { NavController, NavParams, Events, AlertController, ActionSheetController, PopoverController } from 'ionic-angular';
import * as moment from 'moment';
moment.locale('es');
declare var L: any;
@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {

  map
  cluster = L.markerClusterGroup()
  markers = {}
  layers = {
    road: {
      name: 'Rutas',
      url: 'https://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}',
      preview: 'https://korona.geog.uni-heidelberg.de/tiles/roads/x=150&y=249&z=9',
      opts: {
        attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
    },
    mapbox: {
      name: 'Mapbox Streets',
      url: 'https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2VlZGdhYm8iLCJhIjoiY2pjdDNzYzV4MGQ4ZTJxanlzNWVhYzB6MiJ9.xrP9t07VMGpwFwo7E7tP1Q',
      preview: 'https://api.mapbox.com/v4/mapbox.streets/9/150/249.png?access_token=pk.eyJ1Ijoic2VlZGdhYm8iLCJhIjoiY2pjdDNzYzV4MGQ4ZTJxanlzNWVhYzB6MiJ9.xrP9t07VMGpwFwo7E7tP1Q',
      opts: {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18
      }
    },
    osm: {
      name: 'Open Street Maps',
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      preview: 'http://a.tile.osm.org/9/150/249.png',
      opts: {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    world: {
      name: 'Satelital',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      preview: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/9/249/150',
      opts: {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    }
  }
  current_layer = null
  trip_path= null
  disabled_panic = false;
  users = []
  query = ""
  userSelected:any = {}
  locationCreatedHandler = (data) => {
    data.user.location = data.location.location
    this.markerUser(data.user, data.user.id == this.userSelected.id);
  }
  panicHandler = (data) => {
    this.markerUser(data.user, true, true);
  }
  constructor(public navCtrl: NavController, public navParams: NavParams, public events: Events, public alert: AlertController, public actionSheetCtrl: ActionSheetController, public popover: PopoverController, public api: Api, public bg: BgProvider) {
    events.subscribe('LocationCreated', this.locationCreatedHandler)
    events.subscribe('panic', this.panicHandler)
  }

  ionViewDidLoad() {
    this.api.ready.then(() => {
      this.api.startEcho();
      setTimeout(() => {
        this.initMap();
        this.getUsers();
      }, 100)
    })
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


  getUsers() {
    var entidades_ids = this.pluck(this.api.user.entidades, 'id')
    this.api.load(`users?whereIn[entidad_id]=${entidades_ids.join()}&with[]=entidad&order[updated_at]=desc`, 'users_tracks')
      .then((users: Array<any>) => {
        this.users = users;
        users.forEach(u => {
          if (u.location) {
            this.markerUser(u);
          }
        });
        this.fitToAll()

      })
      .catch(this.api.Error);
  }


  // Map Methods
  initMap() {
    this.map = L.map('mapid', { zoomControl: false, maxZoom: 18 }).setView([4.669988, -74.0673856], 13);
    this.api.storage.get('layer')
      .then((layer) => {
        if (layer && this.layers[layer]) {
          this.setLayer(layer)
        } else {
          this.setLayer('road')
        }
      });
    this.map.addLayer(this.cluster);
  }

  setLayer(key) {
    if (this.current_layer) {
      this.map.removeLayer(this.current_layer)
    }
    this.current_layer = L.tileLayer(this.layers[key].url, this.layers[key].opts)
    this.current_layer.addTo(this.map);
    this.api.storage.set('layer', key);
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
    this.userSelected = {}
    var bounds = this.cluster.getBounds()
    if (bounds.isValid())
      this.map.fitBounds(bounds, { padding: [20, 20] })
  }

  centerInUser(user) {
    this.selectUser(user)

    var loc = user.location
    if (loc)
      this.map.panTo([loc.latitude, loc.longitude]);

    var popup = L.popup()
      .setLatLng([loc.latitude, loc.longitude])
      .setContent(this.htmlPopup(user))
      .openOn(this.map);
    this.addAddressPopup(popup)

  }

  markerUser(user, pan = true, panic = false) {
    var loc = user.location
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
      this.selectUser(user)
      var latlng = this.markers[user.id].getLatLng();
      var popup = L.popup()
        .setLatLng(latlng)
        .setContent(this.htmlPopup(user)).openOn(this.map);
      this.addAddressPopup(popup)
    })
  }

  addAddressPopup(popup) {
    this.api.reverseGeo(popup.getLatLng().lat, popup.getLatLng().lng)
      .then((results: any) => {
        popup.setContent(
          popup.getContent()
          + `<br>
          <b>Dirección: </b> ${results.display_name}
        `
        )
      })
      .catch((err)=>{
        popup.setContent(
          popup.getContent()
            + `<br>
            <b>Dirección: </b> Error: Servicio no Disponible
          `
          )
      })
  }

  htmlPopup(user) {
    var html = `
      <h6> ${user.full_name}</h6>
      <span> ${moment.utc(user.location.timestamp.date).local().format('LLLL')}</span>
      <br>
      <span><b>Cargo:</b> ${user.cargo}</any>
      <br>
      <span><b>Departamento:</b>  ${user.departamento}</span>
      <br>
    `
    if (user.location.speed > 0)
      html += `<span>
        <b>Velocidad:</b>
        ${Math.floor(user.location.speed * 3.6)} Kmh
      </span>
    `
    return html;
  }

  getDefaultLocation() {
    navigator.geolocation.getCurrentPosition((data) => {
      this.userSelected = {}
      this.map.panTo(new L.LatLng(data.coords.latitude, data.coords.longitude));
    })
  }

  mapOptions(ev) {
    var popover = this.popover.create("MapOptionsPage", { layers: this.layers })
    popover.present({ ev: ev });
    popover.onWillDismiss((data) => {
      if (!data) { return }
      if (data.action == 'layer') {
        this.setLayer(data.layer)
      }
    })
  }

  selectUser(user){
    this.userSelected = user
    this.getCurrentTrip(user)
  }

  getCurrentTrip(user){
    this.api.get(`trips?with[]=locations&where[user_id]=${user.id}&order[created_at]=desc&limit=1`)
    .then((data:any)=>{
      console.log(data)
      if(data.length > 0){
        if(data[0].locations.length > 10)
          this.drawTrip(data[0].locations)
        else
          this.CallbackTrip(user, data[0])
      }else{
          this.CallbackTrip(user)
      }
    })
    .catch(console.error)
  }
  
  CallbackTrip(user, trip = null){
    this.api.get(`locations?where[user_id]=${user.id}&order[created_at]=desc&${trip ? ("whereDategte[created_at]=" + moment.utc(trip.start).format("YYYY-MM-DD hh:mm:ss") ): "limit=150"}`)
      .then((locations: any) => {  
      this.drawTrip(locations)
    })
    .catch(console.error)
  }

  drawTrip(locations){
    var events= []
    var previousloc
    locations.forEach(loc => {
      if (previousloc && Math.abs(this.bg.getDistanceFromLatLon(loc.location.latitude, loc.location.longitude, previousloc.location.latitude, previousloc.location.longitude)) > 300){
        previousloc = null
      }
      else {
        events[events.length] = new L.LatLng(loc.location.latitude, loc.location.longitude);
        previousloc = loc
      }
    })

    if(this.trip_path){
      this.trip_path.remove()
      this.trip_path = null;
    }

    this.trip_path = new L.Polyline(events, {
      weight: 5,
      opacity: 1.0,
      smoothFactor: 1
    })
    this.trip_path.addTo(this.map)
    this.map.fitBounds(this.trip_path.getBounds())
  }




  private pluck(array, key) {
    var resp = []
    array.forEach(element => {
      resp[resp.length] = element[key]
    });
    return resp
  }
}
