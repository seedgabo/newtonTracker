import { Deeplinks } from '@ionic-native/deeplinks';
import { CodePush } from '@ionic-native/code-push';
import { Api } from './../providers/Api';
import { BackgroundMode } from '@ionic-native/background-mode';
import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, Events } from 'ionic-angular';
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
  pages: Array<{ title: string, component: any, icon: string, if?: any }>;

  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen, public backgroundmode: BackgroundMode, public codePush: CodePush, public deeplinks: Deeplinks, public api: Api, public events: Events) {
    this.initializeApp();
    this.initializeUser();
    this.initializePages();

    this.platform.ready().then(() => {
      this.events.subscribe('login', () => {
        this.initializeUser();
        this.initializePages();
      })
    })
  }

  initializePages() {
    this.api.ready.then(() => {
      this.pages = [];
      if (this.platform.is('mobile') && this.api.user.can_use_tracking) {
        this.pages.push({ title: 'My Tracker', component: HomePage, icon: 'home' })
      }
      if (this.api.user && (this.api.user.roles.collection['Ver Rastreo'] || this.api.user.roles.collection['SuperAdmin'])) {
        this.pages.push({ title: 'Seguimiento', component: ListPage, icon: 'locate' })
      }
      if (this.api.user && (this.api.user.roles.collection['Ver Emergencias'] || this.api.user.roles.collection['SuperAdmin'])) {
        this.pages.push({ title: 'Reportes de Emergencia', component: "PanicLogsPage", icon: 'help-buoy' })
      }
    })

  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleLightContent()
      this.splashScreen.hide();
      this.backgroundmode.enable()
      this.backgroundmode.setDefaults({ hidden: true, silent: true, });
      this.backgroundmode.excludeFromTaskList();
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
          }, (err) => {
            console.warn(err)
            this.splashScreen.hide();
          });
      }
      setInterval(sync, 1000 * 60 * 60 * 8);

      var subsription = () => {
        this.deeplinks.routeWithNavController(this.nav, {
          '/tracking': ListPage,
          'panic-logs': 'PanicLogsPage',
        }).subscribe((match) => {
          // match.$route - the route we matched, which is the matched entry from the arguments to route()
          // match.$args - the args passed in the link
          // match.$link - the full link data
          console.log('Successfully matched route', match);
          this.handlerDeepLinksCallback(match)
        }, (nomatch) => {
          console.log('no matched route', nomatch);
          this.handlerDeepLinksCallback(nomatch)
          // subsription();
        });
      }
      subsription()
    });
  }

  initializeUser() {
    this.api.ready.then((user) => {
      if (!this.api.user) {
        this.nav.setRoot(LoginPage)
      } else {
        if (this.platform.is('mobile') && this.api.user.can_use_tracking) {
          this.nav.setRoot(HomePage);
        } else if (this.api.user && (this.api.user.roles.collection['Ver Rastreo'] || this.api.user.roles.collection['SuperAdmin'])) {
          this.nav.setRoot(ListPage);
        } else {
          this.nav.setRoot("NoUsePage");
        }
        this.api.doLogin().then((response: any) => {
          this.api.saveUser(response);
          this.api.saveData()
          this.api.user = response;
        }).catch(this.api.Error);
      }
    })
  }



  handlerDeepLinksCallback(match) {
    if (match && match.$link) {
      if (match.$link.url && match.$link.url.indexOf("sos") > -1) {
        this.api.ready.then(() => {
          setTimeout(() => {
            this.api.panic().then(() => { }).catch(this.api.Error)
          }, 1200);
        })
      }
    }
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
