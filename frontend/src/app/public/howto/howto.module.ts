import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HowtoSaveComponent } from './howto-save/howto-save.component';
import { HowtoSearchComponent } from './howto-search/howto-search.component';
import { HowToBookmarkletComponent } from './howto-bookmarklets/how-to-bookmarklet.component';
import { HowToCodeletComponent } from './howto-codelets/how-to-codelet.component';
import { HowtoRoutingModule } from './howto-routing.module';
import { HowtoComponent } from './howto.component';
import { HowtoGetStartedComponent } from './howto-get-started/howto-get-started.component';
import { MatExpansionModule } from '@angular/material/expansion';

@NgModule({
  declarations: [
    HowtoComponent,
    HowtoGetStartedComponent,
    HowtoSaveComponent,
    HowtoSearchComponent,
    HowToBookmarkletComponent,
    HowToCodeletComponent
  ],
  imports: [
    HowtoRoutingModule,
    CommonModule,
    MatExpansionModule
  ]
})
export class HowtoModule { }
