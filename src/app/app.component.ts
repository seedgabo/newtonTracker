import { Deeplinks } from '@ionic-native/deeplinks';
import { CodePush } from '@ionic-native/code-push';
import { Api } from './../providers/Api';
import { BackgroundMode } from '@ionic-native/background-mode';
import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';
import { LoginPage } from '../pages/login/login';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any;
  pages: Array<{ title: string, component: any, icon: string, if?:any }>;

  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen, public backgroundmode: BackgroundMode, public codePush: CodePush, public deeplinks:Deeplinks ,public api: Api) {
    this.initializeApp();
    this.initializeUser();

    this.platform.ready().then(() => {
      this.pages = [];
      if (this.platform.is('mobile')) {
        this.pages.push({ title: 'My Tracker', component: HomePage, icon: 'home' })
      }
      this.pages.push({ title: 'Seguimiento', component: ListPage, icon: 'locate' })
      this.pages.push({ title: 'Reportes de Emergencia', component: "PanicLogsPage", icon: 'help-buoy' })
    })
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleLightContent()
      this.splashScreen.hide();
      this.backgroundmode.enable()
      this.backgroundmode.disableWebViewOptimizations()
      this.backgroundmode.setDefaults({ silent: true, });
      this.platform.registerBackButtonAction(() => {
        this.nav.canGoBack() ? this.nav.pop() : this.backgroundmode.moveToBackground()
      });

      var sync = () => {
        this.codePush.sync({ updateDialog: false })
          .subscribe((status) => {
            if (status == 8)
              this.splashScreen.show();
          }, (err) => { console.warn(err) });
      }
      setInterval(sync, 1000 * 60 * 60 * 8);
      sync();

      var subsription = () => {
        this.deeplinks.route({
        }).subscribe((match) => {
          // match.$route - the route we matched, which is the matched entry from the arguments to route()
          // match.$args - the args passed in the link
          // match.$link - the full link data
          console.log('Successfully matched route', match);
        }, (nomatch) => {
          // nomatch.$link - the full link data
          if (nomatch && nomatch.$link) {
            if (nomatch.$link.url && nomatch.$link.url.indexOf("sos") > -1) {
              setTimeout(() => {
                this.api.panic() .then(()=>{ }) .catch(this.api.Error)
              }, 1200);
            }
          }
          subsription();
        });
      }
      subsription()
    });
  }

  initializeUser(){
    this.api.ready.then((user) => {
      if (!user) {
        this.nav.setRoot(LoginPage)
      } else {
        if (this.platform.is('mobile')) {
          this.nav.setRoot(HomePage);
        } else {
          this.nav.setRoot(ListPage);
        }
        this.api.doLogin().then((response: any) => {
          this.api.saveUser(response);
          this.api.saveData()
          this.api.user = response;
        }).catch(this.api.Error);
      }
    })
  }

  openPage(page) {
    this.nav.setRoot(page.component);
  }

  logout() {
    this.api.stopEcho();
    this.api.user = null;
    this.api.storage.clear();
    this.nav.setRoot(LoginPage)
  }


}
