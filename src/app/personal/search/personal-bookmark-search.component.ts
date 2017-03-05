import {Component, OnInit, NgZone} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Bookmark} from "../../model/bookmark";
import {FormControl} from "@angular/forms";
import {BookmarkFilterService} from "../../filter.service";
import {UserBookmarkStore} from "../store/UserBookmarkStore";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: 'personal-bookmark-search',
    templateUrl: 'personal-bookmark-search.component.html',
    styleUrls: [ 'personal-bookmark-search.component.scss' ]
})
export class PersonalBookmarkSearchComponent implements OnInit {

    bookmarks: Observable<Bookmark[]>;
    term = new FormControl();
    public showNotFound: boolean = false;

    constructor(
      private zone:NgZone,
      private route: ActivatedRoute,
      private router: Router,
      private userBookmarkStore: UserBookmarkStore,
      private bookmarkFilterService: BookmarkFilterService) {}

    ngOnInit(): void {
        this.bookmarks = this.term.valueChanges
            .debounceTime(600)        // wait for 300ms pause in events
            .distinctUntilChanged()   // ignore if next search term is same as previous
            .switchMap(term => {
              if(term){// switch to new observable each time
                let filterBookmarksBySearchTerm = this.bookmarkFilterService.filterBookmarksBySearchTerm(term, this.userBookmarkStore.getBookmarks());
                if(filterBookmarksBySearchTerm.length > 0 ){
                  this.showNotFound = false;
                  return Observable.of(filterBookmarksBySearchTerm);
                } else {
                  this.showNotFound = true;
                  return Observable.of<Bookmark[]>([])
                }
              } else {
                // or the observable of empty bookmarks if no search term
                return Observable.of<Bookmark[]>([])
              }
            })
            .catch(error => {
                // TODO: real error handling
                console.log(error);
                return Observable.of<Bookmark[]>([]);
            });
      this.zone.run(() => {
        console.log("ZONE RUN bookmark deleted");
      });
    }

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    let link = ['./bookmarks', bookmark._id];
    this.router.navigate(link, { relativeTo: this.route });
  }

  deleteBookmark(deleted:Bookmark): void {

    let obs = this.userBookmarkStore.deleteBookmark(deleted);
    obs.subscribe(
      res => {
        this.zone.run(() => {
          console.log("ZONE RUN bookmark deleted");
        });

        setTimeout(() => {
          this.term.reset();
        });

      });
  }

}