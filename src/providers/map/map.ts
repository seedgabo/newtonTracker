import { PopoverController } from "ionic-angular";
import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import "rxjs/add/operator/map";
import { Api } from "../Api";
declare var L: any;

@Injectable()
export class MapProvider {
  maps = {};
  markers = {};
  layers = {
    osm: {
      name: "Open Street Maps",
      url: "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
      preview: "http://a.tile.osm.org/9/150/249.png",
      opts: {
        attribution:
          '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }
    },

    mapbox: {
      name: "Mapbox Streets",
      url:
        "https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2VlZGdhYm8iLCJhIjoiY2pjdDNzYzV4MGQ4ZTJxanlzNWVhYzB6MiJ9.xrP9t07VMGpwFwo7E7tP1Q",
      preview:
        "https://api.mapbox.com/v4/mapbox.streets/9/150/249.png?access_token=pk.eyJ1Ijoic2VlZGdhYm8iLCJhIjoiY2pjdDNzYzV4MGQ4ZTJxanlzNWVhYzB6MiJ9.xrP9t07VMGpwFwo7E7tP1Q",
      opts: {
        attribution:
          'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18
      }
    },
    osm: {
      name: "Open Street Maps",
      url: "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
      preview: "http://a.tile.osm.org/9/150/249.png",
      opts: {
        attribution:
          '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    locationiq: {
      name: "Calles",
      url: `https://b-tiles.unwiredlabs.com/o/r/{z}/{x}/{y}.png?key=${
        this.api.locationiq_token
      }&scheme=streets`,
      preview:
        "https://b-tiles.unwiredlabs.com/o/r/9/150/249.png?key=${this.api.locationiq_token}&scheme=streets",
      opts: {
        // attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
    },
    world: {
      name: "Satelital",
      url:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      preview:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/9/249/150",
      opts: {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
      }
    }
  };
  current_layer = null;
  constructor(
    public http: Http,
    public api: Api,
    public popover: PopoverController
  ) {}

  addMap(mapId) {
    var map = L.map(mapId, {
      zoomControl: false,
      maxZoom: 18
    }).setView([4.669988, -74.0673856], 13);
    map.cluster = L.markerClusterGroup();

    this.api.storage.get("layer").then(layer => {
      if (layer && this.layers[layer]) {
        this.setLayer(map, layer);
      } else {
        this.setLayer(map, "road");
      }
    });
    map.addLayer(map.cluster);
    this.defaultFunctions(map);
    this.maps[mapId] = map;
    return map;
  }

  setLayer(map, key) {
    if (this.current_layer) {
      map.removeLayer(this.current_layer);
    }
    this.current_layer = L.tileLayer(
      this.layers[key].url,
      this.layers[key].opts
    );
    this.current_layer.addTo(map);
    this.api.storage.set("layer", key);
  }

  destroyMap(mapId) {
    var map = this.maps[mapId];
    map.remove();
    map.cluster.remove();
    delete this.maps[mapId];
  }

  remove(mapId) {
    this.destroyMap(mapId);
  }

  OpenMapOptions(map, ev) {
    var popover = this.popover.create("MapOptionsPage", {
      layers: this.layers
    });
    popover.present({ ev: ev });
    popover.onWillDismiss(data => {
      if (!data) {
        return;
      }
      if (data.action == "layer") {
        map.setLayer(data.layer);
      }
    });
  }

  private defaultFunctions(map) {
    map.setLayer = layer => {
      this.setLayer(map, layer);
    };
    map.OpenOptions = ev => {
      this.OpenMapOptions(map, ev);
    };
  }
}
