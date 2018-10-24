import { Pipe, PipeTransform } from "@angular/core";
import { Api } from "../../providers/Api";
@Pipe({
  name: "trans"
})
export class TransPipe implements PipeTransform {
  constructor(public api: Api) {}
  transform(value: string, ...args) {
    var replace = args[0];
    if (!this.api.langs) return value;
    var splits = value.split(".");
    var base, trans;
    if (splits.length == 2) {
      base = this.api.langs[splits[0]];
      if (base) {
        trans = base[splits[1]];
        if (trans) {
          value = trans;
        }
      }
    } else {
      base = this.api.langs["__"];
      if (base) {
        trans = base[value];
        if (trans) {
          value = trans;
        }
      }
    }
    for (var key in replace) {
      value = value.replace(":" + key, replace[key]);
    }

    return value.replace("__.", "").replace("literals.", "");
  }
}
