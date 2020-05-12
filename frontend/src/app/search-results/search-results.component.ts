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
import { UserDataStore } from '../core/user/userdata.store';
import { UserData } from '../core/model/user-data';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { PaginationNotificationService } from '../core/pagination-notification.service';
import { SearchDomain } from '../core/model/search-domain.enum';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {

  searchText: string; // holds the value in the search box
  searchDomain: string;

  currentPage: number;
  callerPaginationSearchResults = 'search-results';

  userId: string;
  userIsLoggedIn = false;

  searchResults$: Observable<Bookmark[] | Codelet[]>;
  private userData$: Observable<UserData>;

  selectedTabIndex = 0; // default search in public bookmarks

  constructor(private route: ActivatedRoute,
              private router: Router,
              private publicBookmarksService: PublicBookmarksService,
              private personalBookmarksService: PersonalBookmarksService,
              private personalCodeletsService: PersonalCodeletsService,
              private keycloakService: KeycloakService,
              private keycloakServiceWrapper: KeycloakServiceWrapper,
              private userInfoStore: UserInfoStore,
              private userDataStore: UserDataStore,
              private searchNotificationService: SearchNotificationService,
              private paginationNotificationService: PaginationNotificationService,) {
  }

  ngOnInit() {
    this.searchText = this.route.snapshot.queryParamMap.get('q');
    this.searchDomain = this.route.snapshot.queryParamMap.get('sd') || SearchDomain.PUBLIC_BOOKMARKS;
    this.searchNotificationService.updateSearchBar({
      searchText: this.searchText,
      searchDomain: this.searchDomain
    });

    this.initPageNavigation();

    this.initSelectedTabIndex(this.searchDomain);

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userData$ = this.userDataStore.getUserData$();
          this.userId = userInfo.sub;

          this.searchBookmarks(this.searchText, this.searchDomain);
        });
      } else {
        switch (this.searchDomain) {
          case SearchDomain.MY_BOOKMARKS: {
            this.keycloakServiceWrapper.login();
            break;
          }
          case SearchDomain.MY_CODELETS: {
            this.keycloakServiceWrapper.login();
            break;
          }
          case SearchDomain.PUBLIC_BOOKMARKS: {
            this.searchBookmarks(this.searchText, SearchDomain.PUBLIC_BOOKMARKS);
            break;
          }
        }
        this.searchPublicBookmarks_when_SearchText_but_No_SearchDomain();
      }
    });

    this.searchNotificationService.searchTriggeredSource$.subscribe(searchData => {
      if (searchData.searchDomain === SearchDomain.MY_BOOKMARKS) {
        this.selectedTabIndex = 1;
      } else if (searchData.searchDomain === SearchDomain.MY_CODELETS) {
        this.selectedTabIndex = 2;
      } else {
        this.selectedTabIndex = 0;
      }
      this.searchBookmarks(searchData.searchText, searchData.searchDomain);
    });
  }

  private initPageNavigation() {
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    } else {
      this.currentPage = 1;
    }
    this.paginationNotificationService.pageNavigationClicked$.subscribe(paginationAction => {
      if (paginationAction.caller === this.callerPaginationSearchResults) {
        this.currentPage = paginationAction.page;
        this.searchBookmarks(this.searchText, this.searchDomain);
      }
    });
  }

  private initSelectedTabIndex(searchDomain: string) {
    if (searchDomain === SearchDomain.MY_BOOKMARKS) {
      this.selectedTabIndex = 1;
    } else if (searchDomain === SearchDomain.MY_CODELETS) {
      this.selectedTabIndex = 2;
    }
  }

  private searchPublicBookmarks_when_SearchText_but_No_SearchDomain() {
    if (this.searchText) {
      this.searchBookmarks(this.searchText, SearchDomain.PUBLIC_BOOKMARKS);
    }
  }

  private searchBookmarks(searchText: string, searchDomain: string) {
    this.searchDomain = searchDomain;
    this.searchText = searchText;
    switch (searchDomain) {
      case SearchDomain.MY_BOOKMARKS : {
        this.searchResults$ = this.personalBookmarksService.getFilteredPersonalBookmarks(
          this.searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          this.userId);
        break;
      }
      case SearchDomain.MY_CODELETS : {
        this.searchResults$ = this.personalCodeletsService.getFilteredPersonalCodelets(
          searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          this.userId);
        break;
      }
      case SearchDomain.PUBLIC_BOOKMARKS : {
        this.searchResults$ = this.publicBookmarksService.searchPublicBookmarks(
          searchText, environment.PAGINATION_PAGE_SIZE, this.currentPage, 'relevant'
        );
        break;
      }
    }
  }

  private tryMyCodelets() {
    this.selectedTabIndex = 2;
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          sd: SearchDomain.MY_CODELETS
        },
        queryParamsHandling: 'merge'
      }
    );
    this.searchBookmarks(this.searchText, SearchDomain.MY_CODELETS);
  }

  private tryPublicBookmarks() {
    this.selectedTabIndex = 0;
    this.currentPage = 1;
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          sd: SearchDomain.PUBLIC_BOOKMARKS,
          page: '1'
        },
        queryParamsHandling: 'merge'
      }
    );
    this.searchBookmarks(this.searchText, SearchDomain.PUBLIC_BOOKMARKS);
  }

  private tryPersonalBookmarks() {
    this.selectedTabIndex = 1;
    this.searchDomain = SearchDomain.MY_BOOKMARKS;
    this.currentPage = 1;
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          sd: SearchDomain.MY_BOOKMARKS,
          page: '1'
        },
        queryParamsHandling: 'merge'
      }
    );
    this.searchBookmarks(this.searchText, SearchDomain.MY_BOOKMARKS);
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    switch (this.selectedTabIndex) {
      case 0 : {
        this.tryPublicBookmarks();
        break;
      }
      case 1 : {
        this.tryPersonalBookmarks();
        break;
      }
      case 2 : {
        this.tryMyCodelets();
        break;
      }
    }
  }

}
