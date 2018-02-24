import { Pipe, PipeTransform } from "@angular/core";
import * as moment from "moment";

@Pipe({
  name: "formattedTime"
})
export class FormattedTimePipe implements PipeTransform {
  /**
   * Takes a seconds and makes it format date
   */
  transform(seconds: string, ...args) {
    if (seconds) {
      var sec = parseInt(seconds);
      if (sec < 3600) {
        return moment()
          .startOf("day")
          .seconds(sec)
          .format("m[m] ss[s]");
      } else {
        return moment()
          .startOf("day")
          .seconds(sec)
          .format("H[h] m[m] ss[s]");
      }
    }
  }
}
