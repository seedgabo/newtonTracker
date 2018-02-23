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
    if (seconds)
      return moment().startOf('day').seconds(parseInt(seconds)).format('h[h] m[m] ss[s]');  
  }
}
