import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PublicBookmarksService } from '../public/bookmarks/public-bookmarks.service';
import { PersonalBookmarksService } from '../core/personal-bookmarks.service';
import { PersonalCodeletsService } from '../core/personal-codelets.service';
import { Observable } from 'rxjs';
import { Bookmark } from '../core/model/bookmark';
import { Codelet } from '../core/model/codelet';
import { SearchNotificationService } from '../core/search-notification.service';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakServiceWrapper } from '../core/keycloak-service-wrapper.service';
import { UserInfoStore } from '../core/user/user-info.store';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {

  searchText: string; // holds the value in the search box
  searchDomain: string;
  currentPage = 1;
  userId: string;
  userIsLoggedIn = false;

  searchResults$: Observable<Bookmark[] | Codelet[]>;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private publicBookmarksService: PublicBookmarksService,
              private personalBookmarksService: PersonalBookmarksService,
              private personalCodeletsService: PersonalCodeletsService,
              private keycloakService: KeycloakService,
              private keycloakServiceWrapper: KeycloakServiceWrapper,
              private userInfoStore: UserInfoStore,
              private searchNotificationService: SearchNotificationService) {
  }

  ngOnInit() {
    this.searchText = this.route.snapshot.queryParamMap.get('q');
    this.searchDomain = this.route.snapshot.queryParamMap.get('sd');
    this.userId = this.route.snapshot.queryParamMap.get('userId');

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
          if (this.searchDomain === 'personal') {
            this.searchPersonalBookmarks(this.searchText);
          } else if (this.searchDomain === 'my-codelets') {
            this.searchMyCodelets(this.searchText);
          } else {
            this.searchPublicBookmarks(this.searchText);
          }
        });
      } else {
        switch (this.searchDomain) {
          case 'personal': {
            this.keycloakServiceWrapper.login();
            break;
          }
          case 'my-codelets': {
            this.keycloakServiceWrapper.login();
            break;
          }
          default: {
            this.searchDomain = 'public';
            this.searchPublicBookmarks(this.searchText);
            break;
          }
        }
      }
    });

    this.searchNotificationService.searchTriggeredSource$.subscribe(searchData => {
      switch (searchData.searchDomain) {
        case 'personal': {
          this.searchDomain = searchData.searchDomain;
          this.searchPersonalBookmarks(searchData.searchText);
          break;
        }
        case 'my-codelets': {
          this.searchDomain = searchData.searchDomain;
          this.searchMyCodelets(searchData.searchText);
          break;
        }
        case 'public': {
          this.searchDomain = searchData.searchDomain;
          this.searchPublicBookmarks(this.searchText);
          break;
        }
      }
    });
  }

  private searchPublicBookmarks(searchText: string) {
    this.searchResults$ = this.publicBookmarksService.getFilteredPublicBookmarks(
      this.searchText, environment.PAGINATION_PAGE_SIZE, 1, 'relevant'
    );
  }

  private searchMyCodelets(searchText: string) {
    this.searchResults$ = this.personalCodeletsService.getFilteredPersonalCodelets(
      this.searchText,
      environment.PAGINATION_PAGE_SIZE,
      1,
      this.userId);
  }

  private searchPersonalBookmarks(searchText: string) {
    this.searchResults$ = this.personalBookmarksService.getFilteredPersonalBookmarks(
      this.searchText,
      environment.PAGINATION_PAGE_SIZE,
      1,
      this.userId);
  }

  private tryMyCodelets() {
    this.searchDomain = 'my-codelets';
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          sd: 'my-codelets'
        },
        queryParamsHandling: 'merge'
      }
    );
    this.searchMyCodelets(this.searchText);
  }

  private tryPublicBookmarks() {
    this.searchDomain = 'public';
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          sd: 'public'
        },
        queryParamsHandling: 'merge'
      }
    );
    this.searchPublicBookmarks(this.searchText);
  }

  private tryPersonalBookmarks() {
    this.searchDomain = 'personal';
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          sd: 'personal'
        },
        queryParamsHandling: 'merge'
      }
    );
    this.searchPersonalBookmarks(this.searchText);
  }

}
