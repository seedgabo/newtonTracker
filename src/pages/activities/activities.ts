import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Api } from '../../providers/Api';
@IonicPage({
  // defaultHistory: ["ListPage"],
  segment:"tracking/:userId/activities"
})
@Component({
  selector: 'page-activities',
  templateUrl: 'activities.html',
})
export class ActivitiesPage {
  userId:number
  user: any = {}
  activities = []
  trips = []
  loading = false
  icons = {
    'still': 'locate',
    'on_foot': 'walk',
    'running': 'walk',
    'in_vehicle': 'car',
    'on_bycicle': 'bicycle',
    'on_trip': 'navigate'
  }
  acts = {
    'on_foot': 'A pie',
    'still': 'Parado',
    'in_vehicle': 'En vehiculo',
    'on_bycicle': 'En Bicicleta',
    'running': 'Corriendo'
  }
  colors = {
    'on_foot': 'primary',
    'still': 'danger',
    'running': 'favorite',   
    'in_vehicle': 'secondary',
    'on_bycicle': 'warning',
  }
  constructor(public navCtrl: NavController, public navParams: NavParams, public api:Api) {
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
            this.user =this.api.objects.users_tracks.collection[this.userId]
            this.getActivities();

          })
      })
    }
  }

  ionViewDidLoad() {
  }

  getActivities() {
    this.loading = true
    this.api.get(`activities?where[user_id]=${this.user.id}&limit=200`)
    .then((resp:any) => {
      this.activities = resp.reverse()
      this.loading  = false
      this.getTrips()
    })
    .catch((err) => {
      this.api.Error(err)
      this.loading  = false
    })
  }
  
  getTrips() {
    this.loading = true
    this.api.get(`trips?where[user_id]=${this.user.id}&limit=200`)
    .then((data:any) => {
      this.trips = data.reverse()
      this.loading  = false
    })
    .catch((err) => {
      this.api.Error(err)
      this.loading  = false
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
