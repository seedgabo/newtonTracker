import { IonicStorageModule } from '@ionic/storage';
import { Api } from './../providers/Api';
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Autostart } from "@ionic-native/autostart";
import { BackgroundMode } from "@ionic-native/background-mode";
import { BackgroundGeolocation } from "@ionic-native/background-geolocation";
import { BatteryStatus } from "@ionic-native/battery-status";
import { Camera } from "@ionic-native/camera";
import { CodePush } from "@ionic-native/code-push";
import { Deeplinks } from "@ionic-native/deeplinks";
import { Device } from "@ionic-native/device";
import { Vibration } from "@ionic-native/vibration";
import { HttpModule } from '@angular/http';
import { BgProvider } from '../providers/bg/bg';
import { LoginPage } from '../pages/login/login';


import { MomentModule } from 'angular2-moment';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    LoginPage,
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicStorageModule.forRoot(),
    IonicModule.forRoot(MyApp),
    MomentModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    LoginPage,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Autostart,
    BackgroundMode, BackgroundGeolocation, BatteryStatus, Camera, CodePush, Deeplinks, Device, Vibration,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    Api,
    BgProvider
  ]
})
export class AppModule { }
