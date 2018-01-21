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
  pages: Array<{ title: string, component: any, icon: string }>;

  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen, public backgroundmode: BackgroundMode, public codePush: CodePush, public api: Api) {
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
      { title: 'Home', component: HomePage, icon: 'home' },
      { title: 'Seguimiento', component: ListPage, icon: 'locate' }
    ];

  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleLightContent()
      this.splashScreen.hide();
      this.backgroundmode.enable()
      this.backgroundmode.disableWebViewOptimizations()
      this.backgroundmode.configure({
        silent: true,
        hidden: true,
      });
      this.platform.registerBackButtonAction(() => {
        if (this.nav.canGoBack())
          return this.nav.pop();
        else {
          this.backgroundmode.moveToBackground();
        }
      });

      this.codePush.sync().subscribe((syncStatus) => console.log(syncStatus), console.warn);

    });
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
