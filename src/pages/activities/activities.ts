import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Api } from '../../providers/Api';
@IonicPage({
  defaultHistory: ["ListPage"],
  segment: "tracking/:userId/activities"
})
@Component({
  selector: 'page-activities',
  templateUrl: 'activities.html',
})
export class ActivitiesPage {
  userId: number
  user: any = {}
  activities = []
  trips = []
  loading = false
  icons = {
    'still': 'locate',
    'on_foot': 'walk',
    'running': 'walk',
    'in_vehicle': 'car',
    'on_bicycle': 'bicycle',
    'on_trip': 'navigate'
  }
  acts = {
    'on_foot': 'A pie',
    'still': 'Detenido',
    'in_vehicle': 'En vehiculo',
    'on_bicycle': 'En Bicicleta',
    'running': 'Corriendo'
  }
  colors = {
    'on_foot': 'primary',
    'still': 'neutral',
    'running': 'favorite',
    'in_vehicle': 'secondary',
    'on_bicycle': 'warning',
  }
  list = "Actividad"
  constructor(public navCtrl: NavController, public navParams: NavParams, public api: Api) {
    if (this.navParams.get('user')) {
      this.user = this.navParams.get('user');
      this.getActivities();
    }
    else if (this.navParams.get('userId')) {
      this.userId = this.navParams.get('userId')
      this.api.ready.then(() => {
        var entidades_ids = this.pluck(this.api.user.entidades, 'id')
        this.api.load(`users?whereIn[entidad_id]=${entidades_ids.join()}&with[]=entidad&order[updated_at]=desc`, 'users_tracks')
          .then((users: Array<any>) => {
            this.user = this.api.objects.users_tracks.collection[this.userId]
            this.getActivities();

          })
      })
    }
  }

  ionViewDidLoad() {
  }

  getActivities(refresher = null) {
    this.loading = true
    this.api.get(`activities?where[user_id]=${this.user.id}&limit=200`)
      .then((resp: any) => {
        this.activities = resp.reverse()
        this.loading = false
        this.getTrips(refresher)
      })
      .catch((err) => {
        this.api.Error(err)
        this.loading = false
        if (refresher)
          refresher.complete()
      })
  }

  getTrips(refresher = null) {
    this.loading = true
    this.api.get(`trips?where[user_id]=${this.user.id}&limit=200`)
      .then((data: any) => {
        this.trips = data.reverse()
        this.loading = false
        if (refresher)
          refresher.complete()
      })
      .catch((err) => {
        this.api.Error(err)
        this.loading = false
        if (refresher)
          refresher.complete()
      })
  }

  geocode(activity) {
    this.api.reverseGeo(activity.location.coords.latitude, activity.location.coords.longitude)
      .then(() => {

      })
      .catch(console.error)
  }

  gotoTrip(trip) {
    this.navCtrl.push('TripPage', { trip: trip, tripId: trip.id})
  }

  private pluck(array, key) {
    var resp = []
    array.forEach(element => {
      resp[resp.length] = element[key]
    });
    return resp
  }

}
