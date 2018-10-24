import { NgModule } from "@angular/core";
import { FormattedTimePipe } from "./formatted-time/formatted-time";
import { TransPipe } from "./trans/trans";
@NgModule({
  declarations: [FormattedTimePipe, TransPipe],
  imports: [],
  exports: [FormattedTimePipe, TransPipe]
})
export class PipesModule {}
