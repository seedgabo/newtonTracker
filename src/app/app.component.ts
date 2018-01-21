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

  pages: Array<{ title: string, component: any }>;

  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen, public backgroundmode: BackgroundMode, public api: Api) {
    this.initializeApp();

    this.api.ready.then((user) => {
      if (!user) {
        this.nav.setRoot(LoginPage)
      } else {
        this.nav.setRoot(HomePage);
      }
    })

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Home', component: HomePage },
      // { title: 'List', component: ListPage }
    ];

  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      // this.statusBar.styleDefault()
      this.statusBar.styleLightContent()
      this.splashScreen.hide();
      this.backgroundmode.configure({
        silent: true,
        hidden: true,
      });
      this.backgroundmode.enable()
      this.backgroundmode.disableWebViewOptimizations()
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }

  logout() {
    this.api.stopEcho();
    this.api.user = null;
    this.api.storage.clear();
    this.nav.setRoot(LoginPage)
  }


}
