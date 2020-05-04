import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { PublicBookmarksService } from '../public/bookmarks/public-bookmarks.service';
import { PersonalBookmarksService } from '../core/personal-bookmarks.service';
import { PersonalCodeletsService } from '../core/personal-codelets.service';
import { Observable } from 'rxjs';
import { Bookmark } from '../core/model/bookmark';
import { Codelet } from '../core/model/codelet';
import { SearchNotificationService } from '../core/search-notification.service';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {

  searchText: string; // holds the value in the search box
  searchDomain: string;
  userId: string;

  searchResults$: Observable<Bookmark[] | Codelet[]>;

  constructor(private route: ActivatedRoute,
              private publicBookmarksService: PublicBookmarksService,
              private personalBookmarksService: PersonalBookmarksService,
              private personalCodeletsService: PersonalCodeletsService,
              private searchNotificationService: SearchNotificationService) {
  }

  ngOnInit() {
    this.searchText = this.route.snapshot.queryParamMap.get('q');
    this.searchDomain = this.route.snapshot.queryParamMap.get('sd');
    this.userId = this.route.snapshot.queryParamMap.get('userId');

    if (this.searchDomain === 'personal') {
      this.searchResults$ = this.personalBookmarksService.getFilteredPersonalBookmarks(
        this.searchText,
        environment.PAGINATION_PAGE_SIZE,
        1,
        this.userId);
    } else if (this.searchDomain === 'my-codelets') {
      this.searchResults$ = this.personalCodeletsService.getFilteredPersonalCodelets(
        this.searchText,
        environment.PAGINATION_PAGE_SIZE,
        1,
        this.userId);
    } else {
      this.searchResults$ = this.publicBookmarksService.getFilteredPublicBookmarks(
        this.searchText, environment.PAGINATION_PAGE_SIZE, 1, 'relevant'
      );
    }
  }
}


/*  searchBookmarks(searchText: string) {
    if (searchText.trim() !== '') {
      if (this.searchDomain === 'personal' && this.userId) {
        this.searchResults$ = this.personalBookmarksService.getFilteredPersonalBookmarks(searchText, environment.PAGINATION_PAGE_SIZE, this.currentPage, this.userId);
      } else if (this.searchDomain === 'my-codelets' && this.userId) {
        this.searchResults$ = this.personalCodeletsService.getFilteredPersonalCodelets(searchText, environment.PAGINATION_PAGE_SIZE, this.currentPage, this.userId);
      } else {
        this.searchResults$ = this.publicBookmarksService.getFilteredPublicBookmarks(searchText, environment.PAGINATION_PAGE_SIZE, this.currentPage, 'relevant');
      }
    }

  }*/
