import { Observable } from 'rxjs';

import { map, startWith } from 'rxjs/operators';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Bookmark } from '../../core/model/bookmark';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { KeycloakService } from 'keycloak-angular';
import { Search, UserData } from '../../core/model/user-data';
import { MatAutocompleteSelectedEvent, MatDialog, MatDialogConfig } from '@angular/material';
import { UserDataStore } from '../../core/user/userdata.store';
import { PublicBookmarksService } from '../../public/bookmarks/public-bookmarks.service';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { KeycloakServiceWrapper } from '../../core/keycloak-service-wrapper.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { LoginRequiredDialogComponent } from '../login-required-dialog/login-required-dialog.component';
import { Codelet } from '../../core/model/codelet';
import { PersonalCodeletsService } from '../../core/personal-codelets.service';
import { SearchNotificationService } from '../../core/search-notification.service';

export interface SearchDomain {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-searchbar',
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.scss']
})
export class SearchbarComponent implements OnInit {

  @Input()
  context: string;

  @Output()
  searchTriggered = new EventEmitter<boolean>();

  @Output()
  searchTextCleared = new EventEmitter<boolean>();

  _userData: UserData;

  searchResults$: Observable<Bookmark[] | Codelet[]>;

  searchControl = new FormControl();
  searchBoxText: string; // holds the value in the search box
  public showNotFound = false;

  userIsLoggedIn = false;
  userId: string;

  autocompleteSearches: Search[] = [];
  filteredSearches: Observable<Search[]>;

  isFocusOnSearchControl = false;

  showSearchResults = false;
  hover = false;

  searchDomain = 'public';

  searchDomains: SearchDomain[] = [
    {value: 'personal', viewValue: 'My bookmarks'},
    {value: 'public', viewValue: 'Public bookmarks'},
    {value: 'my-codelets', viewValue: 'My codelets'}
  ];

  currentPage: number;
  callerPaginationSearchResults = 'search-results';

  constructor(private router: Router,
              private route: ActivatedRoute,
              private searchNotificationService: SearchNotificationService,
              private bookmarkStore: PublicBookmarksStore,
              private publicBookmarksService: PublicBookmarksService,
              private personalBookmarksService: PersonalBookmarksService,
              private personalCodeletsService: PersonalCodeletsService,
              private paginationNotificationService: PaginationNotificationService,
              private keycloakService: KeycloakService,
              private keycloakServiceWrapper: KeycloakServiceWrapper,
              private userDataStore: UserDataStore,
              private userInfoStore: UserInfoStore,
              private loginDialog: MatDialog) {
  }

  @Input()
  set userData$(userData$: Observable<UserData>) {
    if (userData$) {
      userData$
        .subscribe(userData => {
          this.userId = userData.userId;
          const emptyUserData = Object.keys(userData).length === 0 && userData.constructor === Object; // = {}
          if (emptyUserData) {
            this._userData = userData; // = {}
          } else {
            this._userData = userData;
            this.autocompleteSearches = this._userData.searches;
            this.setFilteredSearches$(this.searchDomain);
          }
        });
    }
  }

  private setFilteredSearches$(searchDomain: string) {
    this.filteredSearches = this.searchControl.valueChanges
      .pipe(
        startWith(null),
        map((searchText: string | null) => {
          return searchText ? this._filter(searchText) : this.autocompleteSearches.filter(item => item.searchDomain === searchDomain);
        })
      );
  }

  private _filter(value: string): Search[] {
    const filterValue = value.toLowerCase();

    return this.autocompleteSearches.filter(item => item.text.toLowerCase().includes(filterValue) && item.searchDomain === this.searchDomain);
  }

  ngOnInit(): void {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      this.userIsLoggedIn = true;
    });

    this.searchNotificationService.searchTriggeredFromNavbar$.subscribe(searchData => {
      this.searchDomain = searchData.searchDomain;
      this.searchControl.setValue(searchData.searchText);
    });

    // TODO - remove this
    this.watchSearchBoxValueChanges();

    /* TODO move this to search-results page
      const page = this.route.snapshot.queryParamMap.get('page');
        if (page) {
          this.currentPage = parseInt(page, 0);
        } else {
          this.currentPage = 1;
        }

        this.paginationNotificationService.pageNavigationClicked$.subscribe(paginationAction => {
          if (paginationAction.caller === this.callerPaginationSearchResults) {
            this.currentPage = paginationAction.page;
            this.triggerBookmarkSearch(this.searchBoxText);
          }
        })
        */

  }

  private watchSearchBoxValueChanges() {
    this.searchControl.valueChanges.subscribe(val => {
      this.searchBoxText = val;
      // TODO remove this
      // this.syncQueryParamsWithSearchBox();
    });
  }

  /*
   This was used here homepage.component.html

         <app-async-bookmark-list *ngIf="searchComponent.searchDomain !== 'my-codelets'; else showCodeletResults"
                               [bookmarks$]="searchComponent.searchResults$"
                               [queryText]="searchComponent.searchBoxText"
                               [userData$]="userData$"
                               [callerPagination]="searchComponent.callerPaginationSearchResults"
                               (bookmarkDeleted)="searchComponent.onBookmarkDeleted($event)">
   */
  onBookmarkDeleted(deleted: boolean) {
    if (deleted) {
      this.searchControl.setValue(this.searchBoxText);
    }
  }

  onSearchDomainChange(selectedSearchDomain) {
    this.setFilteredSearches$(selectedSearchDomain);

    if ((selectedSearchDomain === 'personal' || selectedSearchDomain === 'my-codelets') && !this.userIsLoggedIn) {
      this.searchDomain = 'public';
      this.showLoginRequiredDialog('You need to be logged in to search in your personal bookmarks');
    } else {
      this.searchDomain = selectedSearchDomain;
      // TODO - remove next line
      // this.syncQueryParamsWithSearchBox();
      if (this.searchBoxText && this.searchBoxText !== '') {
        this.triggerBookmarkSearch(this.searchBoxText);
      }
    }
  }

  private showLoginRequiredDialog(message: string) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      message: message
    };

    const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
  }

  onSaveSearchClick() {
    if (!this.userIsLoggedIn) {
      this.showLoginRequiredDialog('You need to be logged in to save searches')
    } else {
      const now = new Date();
      const newSearch: Search = {
        text: this.searchBoxText,
        createdAt: now,
        lastAccessedAt: now,
        searchDomain: this.searchDomain,
        count: 1
      }
      const emptyUserData = Object.keys(this._userData).length === 0 && this._userData.constructor === Object;
      if (emptyUserData) {
        this._userData = {
          userId: this.userId,
          searches: [newSearch]
        }
      } else {
        this._userData.searches = this._userData.searches.filter(item => item.text.trim().toLowerCase() !== this.searchBoxText.trim().toLowerCase());
        this._userData.searches.unshift(newSearch);
      }
      this.userDataStore.updateUserData$(this._userData).subscribe();
    }
  }

  onAutocompleteSelectionChanged(event: MatAutocompleteSelectedEvent) {
    const selectedValue = event.option.value;
    const index = this._userData.searches.findIndex((search: Search) => search.text === selectedValue);
    const updatedSearch: Search = this._userData.searches.splice(index, 1)[0];
    updatedSearch.lastAccessedAt = new Date();
    if (updatedSearch.count) {
      updatedSearch.count++;
    } else {
      updatedSearch.count = 1;
    }
    this._userData.searches.unshift(updatedSearch);

    this.userDataStore.updateUserData$(this._userData).subscribe();
    this.triggerBookmarkSearch(selectedValue);
  }

  focusOnSearchControl() {
    this.isFocusOnSearchControl = true;
  }

  unFocusOnSearchControl() {
    this.isFocusOnSearchControl = false;
  }

  searchBookmarksFromSearchBox(searchText: string) {
    this.currentPage = 1;
    this.triggerBookmarkSearch(searchText);
    // this.syncQueryParamsWithSearchBox();
  }

  triggerBookmarkSearch(searchText: string) {
    if (searchText.trim() !== '') {
      this.router.navigate(['./search-results'],
        {
          queryParams: {q: searchText, sd: this.searchDomain, page: this.currentPage, userId: this.userId}
        }).then(() => {
        this.searchNotificationService.triggerSearch(
          {
            searchText: this.searchBoxText,
            searchDomain: this.searchDomain
          });
      });
    }

  }

  /* TODO - remove this
    syncQueryParamsWithSearchBox() {
      if (this.searchBoxText) {
        this.router.navigate(['.'],
          {
            relativeTo: this.route,
            queryParams: {q: this.searchBoxText, sd: this.searchDomain, page: this.currentPage},
            queryParamsHandling: 'merge'
          }
        );
      } else {
        this.searchTextCleared.emit(true);
        this.router.navigate(['./'],
          {
            relativeTo: this.route,
            queryParams: {q: null, sd: null, page: null},
            queryParamsHandling: 'merge'
          }
        );
      }
    }*/

  clearSearchBoxText() {
    this.searchControl.patchValue('');
  }
}
