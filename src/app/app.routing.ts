import {RouterModule, Routes} from "@angular/router";
import {AboutComponent} from "./about/about.component";
import {BookmarksComponent} from "./bookmark/bookmarks.component";
import {SearchResultsComponent} from "./navigation/search/search-results.component";

const routes: Routes = [
  {
    path: '',
    component: BookmarksComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'search-results',
    component: SearchResultsComponent
  },

  /*
  {
    path: 'personal',
    loadChildren: './personal/user-bookmarks.module#UserBookmarksModule'
  }
  */
];

export const routing = RouterModule.forRoot(routes);