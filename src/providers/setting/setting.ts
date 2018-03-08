import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Storage } from "@ionic/storage";
@Injectable()
export class SettingProvider {
  language = 'es';
  panics = true
  tts = true
  constructor(private storage: Storage) {
    this.storage.get('setting').then((data) => {
      if (data) {
        this.language = data.language
        if (this.tts !== undefined)
          this.tts = data.tts
        if (this.panics !== undefined)
          this.panics = data.panics
      }
    })
  }

  save() {
    this.storage.set('setting', {
      language: this.language,
      tts: this.tts,
      panics: this.panics
    })
  }

  default() {
    this.language = window.navigator.language.substring(0, 2)
    this.tts = true
    this.panics = true
    this.save()
  }

}
