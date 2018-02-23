import { NgModule } from '@angular/core';
import { FormattedTimePipe } from './formatted-time/formatted-time';
@NgModule({
	declarations: [FormattedTimePipe],
	imports: [],
	exports: [FormattedTimePipe]
})
export class PipesModule {}
