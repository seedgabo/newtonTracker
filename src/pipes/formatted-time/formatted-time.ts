import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'formattedTime',
})
export class FormattedTimePipe implements PipeTransform {
  /**
   * Takes a seconds and makes it format date
   */
  transform(seconds: string, ...args) {
    if (seconds) {
      var date = moment().locale('en').startOf('day').seconds(Number(seconds))
      if (Number(seconds) > 3600)
        return date.format('H[h] m[m] s[s]');
      return date.format('m[m] s[s]');
    }
  }
}
