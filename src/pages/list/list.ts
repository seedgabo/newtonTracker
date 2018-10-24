import { MapProvider } from "./../../providers/map/map";
import { BgProvider } from "./../../providers/bg/bg";
import { Api } from "./../../providers/Api";
import { Component, ViewChild } from "@angular/core";
import { NavController, NavParams, Events, AlertController, ActionSheetController, IonicPage } from "ionic-angular";
import { VirtualScrollComponent } from "angular2-virtual-scroll";
import * as moment from "moment";
moment.locale("es-us");
declare var L: any;
declare var window: any;

@IonicPage({
  priority: "high",
  segment: "tracking"
})
@Component({
  selector: "page-list",
  templateUrl: "list.html"
})
export class ListPage {
  @ViewChild(VirtualScrollComponent)
  private virtualScroll: VirtualScrollComponent;
  map;
  markers = {};
  activities = {
    on_foot: "A pie",
    still: "Detenido",
    in_vehicle: "En vehiculo",
    on_bicycle: "En Bicicleta",
    running: "Corriendo"
  };
  trip_path = null;
  disabled_panic = false;
  users;
  query = "";
  userSelected: any = {};
  locationCreatedHandler = (data) => {
    data.user.location = data.location.location;
    this.markerUser(data.user, data.user.id == this.userSelected.id);
    if (this.trip_path && data.user.id == this.userSelected.id) {
      this.trip_path.addLatLng(new L.LatLng(data.location.location.latitude, data.location.location.longitude));
    }
  };
  panicHandler = (data) => {
    this.markerUser(data.user, true, true);
  };
  tripTimeout = 0;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    public alert: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public api: Api,
    public bg: BgProvider,
    public Map: MapProvider
  ) {
    events.subscribe("LocationCreated", this.locationCreatedHandler);
    events.subscribe("panic", this.panicHandler);
  }
  ionViewDidEnter() {
    this.api.ready.then(() => {
      this.api.startEcho();
      setTimeout(() => {
        this.map = this.Map.addMap("mapid");
        this.getUsers();
      }, 100);
    });
  }

  ionViewWillUnload() {
    this.Map.destroyMap("mapid");
    this.events.unsubscribe("LocationCreated", this.locationCreatedHandler);
    this.events.unsubscribe("panic", this.panicHandler);
  }

  filter() {
    var result;
    if (this.query == "") {
      result = this.api.objects.users_tracks;
    } else {
      var finder = this.query.toLowerCase().trim();
      result = this.api.objects.users_tracks.filter((u) => {
        return u.full_name.toLowerCase().indexOf(finder) > -1 || (u.entidad && u.entidad.name.toLowerCase().indexOf(finder) > -1);
      });
    }
    this.users = result;
  }

  refreshScroll() {
    this.users = [];
    this.map.closePopup();
    setTimeout(() => {
      this.filter();
      this.virtualScroll.refresh();
    }, 250);
  }

  async getUsers() {
    var u: any = await this.api.get(`users/${this.api.user.id}?with[]=entidades`);
    console.log(u);
    var entidades_ids = this.pluck(u.entidades, "id");
    this.api
      .load(`users?whereIn[entidad_id]=${entidades_ids.join()}&with[]=entidad&order[updated_at]=desc`, "users_tracks")
      .then((users: Array<any>) => {
        this.users = users;
        users.forEach((u) => {
          if (u.location) {
            this.markerUser(u);
          }
        });
        this.fitToAll();
      })
      .catch((err) => {
        this.api.Error(err);
      });
  }

  locate() {
    if (this.bg.bg) this.bg.locate().then((pos) => {});
  }

  sos() {
    this.disabled_panic = true;
    this.api
      .panic()
      .then(() => {
        this.disabled_panic = false;
      })
      .catch(() => {
        this.disabled_panic = false;
      });
  }

  fitToAll() {
    this.userSelected = {};
    var bounds = this.map.cluster.getBounds();
    if (bounds.isValid()) this.map.fitBounds(bounds, { padding: [20, 20] });
  }

  centerInUser(user) {
    this.selectUser(user);

    var loc = user.location;
    if (loc) this.map.flyTo([loc.latitude, loc.longitude]);

    var popup = L.popup()
      .setLatLng([loc.latitude, loc.longitude])
      .setContent(this.htmlPopup(user))
      .openOn(this.map);
    this.addAddressPopup(popup);
  }

  markerUser(user, pan = true, panic = false) {
    var loc = user.location;
    if (this.markers[user.id]) {
      this.map.cluster.removeLayer(this.markers[user.id]);
      delete this.markers[user.id];
    }
    var icon = L.divIcon({
      className: "user-icon",
      iconSize: [50, 50],
      html: `
      <img src="${user.imagen}"  class="user-img-icon ${panic ? "pulse" : "online"}"/>
        <div class="label-map""><div>
        ${user.full_name}
        </div></div>
        `
    });
    if (pan) this.map.panTo(new L.LatLng(loc.latitude, loc.longitude));
    this.markers[user.id] = L.marker([loc.latitude, loc.longitude], { icon: icon });

    this.map.cluster.addLayer(this.markers[user.id]);
    this.map.cluster.refreshClusters(this.markers[user.id]);
    this.markers[user.id].on("click", (ev) => {
      this.selectUser(user);
      var latlng = this.markers[user.id].getLatLng();
      var popup = L.popup()
        .setLatLng(latlng)
        .setContent(this.htmlPopup(user))
        .openOn(this.map);
      this.addAddressPopup(popup);
    });
  }

  addAddressPopup(popup) {
    this.api
      .reverseGeo(popup.getLatLng().lat, popup.getLatLng().lng)
      .then((results: any) => {
        popup.setContent(
          popup.getContent() +
            `<span style="font-size:11px">
          ${results.display_name}</span>
          `
        );
      })
      .catch((err) => {
        popup.setContent(
          popup.getContent() +
            `
            <b>Dirección: </b> Error: Servicio no Disponible
          `
        );
      });
  }

  htmlPopup(user) {
    window.callbackActivity = () => {
      this.selectUser(user);
    };
    var state = "none";
    if (this.api.objects.users_online && this.api.objects.users_online.collection[user.id]) {
      state = "online";
    } else {
      state = "offline";
    }
    var html = `
      <h6>
        <div class="user-state ${state}"></div>
        ${user.full_name}
        <small style="float:right">
          <i class="fa fa-android fa-lg" style="color:#A4C639"></i>
          ${moment
            .utc(user.location.timestamp.date)
            .local()
            .calendar()}
        </small>
      </h6>
      <p>
        <span>Actividad:</span> <span style="color:#489dff"> ${
          user.activity ? this.activities[user.activity.activity] : "Desconocida"
        }</span>
        <small>&nbsp;&nbsp; Desde  ${user.activity ? moment(user.activity.created_at).calendar() : ""} </small>
      </p>
      <span><span>Cargo:</span> ${user.cargo}</span>
      <br>
      <span><span>Departamento:</span>  ${user.departamento}</span>
      <br>
      <button onclick="callbackActivity()" block text-center class="button button-md button-default button-default-md button-block button-block-md button-small button-small-md button-md-primary">
        <span class="button-inner">
          Ver Usuario
        </span>
        <div class="button-effect"></div>
      </button>
    `;
    if (user.location.speed > 0)
      html += `<span>
        <b>Velocidad:</b>
        ${Math.floor(user.location.speed * 3.6)} Kmh
      </span>
    `;
    return html;
  }

  mapOptions(ev) {
    this.map.OpenOptions(ev);
  }

  selectUser(user) {
    if (this.userSelected == user) {
      this.userSelected = {};
      this.map.closePopup();
      return this.navCtrl.push("ActivitiesPage", { user: user, userId: user.id });
    }
    this.userSelected = user;
    if (this.trip_path) {
      this.trip_path.remove();
      this.trip_path = null;
    }
    clearTimeout(this.tripTimeout);
    this.tripTimeout = setTimeout(() => {
      this.getCurrentTrip(user);
    }, 300);
  }

  getCurrentTrip(user) {
    if (!user.activity) return;
    this.api
      .get(`trips?scope[valid]=3&with[]=locations&where[user_id]=${user.id}&order[created_at]=desc&limit=1`)
      .then((data: any) => {
        console.log(data);
        if (data.length > 0) this.drawTrip(data[0].locations);
      })
      .catch(console.error);
  }

  CallbackTrip(user, trip = null) {
    this.api
      .get(
        `locations?where[user_id]=${user.id}&order[created_at]=desc&${
          trip ? "whereDategte[created_at]=" + moment.utc(trip.start).format("YYYY-MM-DD hh:mm:ss") : "limit=150"
        }`
      )
      .then((locations: any) => {
        this.drawTrip(locations, { color: "#ff7707", weight: 5, opacity: 1.0, smoothFactor: 1 });
      })
      .catch(console.error);
  }

  drawTrip(locations, options: any = { weight: 5, opacity: 1.0, smoothFactor: 1 }) {
    var events = [];
    var previousloc = locations[0];
    locations
      .sort(function(a, b) {
        return moment.utc(b).diff(moment.utc(a));
      })
      .forEach((loc) => {
        var dist = 0;
        if (previousloc)
          dist = Math.abs(
            this.bg.getDistanceFromLatLon(
              loc.location.latitude,
              loc.location.longitude,
              previousloc.location.latitude,
              previousloc.location.longitude
            )
          );
        if (dist < 200) {
          events[events.length] = new L.LatLng(loc.location.latitude, loc.location.longitude);
        }
        previousloc = loc;
      });

    if (this.trip_path) {
      this.trip_path.remove();
      this.trip_path = null;
    }

    this.trip_path = new L.Polyline(events, options);
    this.trip_path.addTo(this.map);
    // this.map.fitBounds(this.trip_path.getBounds())
  }

  private pluck(array, key) {
    var resp = [];
    array.forEach((element) => {
      resp[resp.length] = element[key];
    });
    return resp;
  }
}
