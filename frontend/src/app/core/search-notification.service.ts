import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { PaginationAction } from './model/pagination-action';
import { SearchData } from './model/search-data';

@Injectable()
export class SearchNotificationService {

  // Observable string sources
  private searchTriggeredSource = new Subject<SearchData>();

  // Observable string streams
  searchTriggeredSource$: Observable<SearchData> = this.searchTriggeredSource.asObservable();

  triggerSearch(searchData: SearchData) {
    this.searchTriggeredSource.next(searchData);
  }

}
