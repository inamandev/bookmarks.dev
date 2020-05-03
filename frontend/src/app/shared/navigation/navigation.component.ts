import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';
import { KeycloakServiceWrapper } from '../../core/keycloak-service-wrapper.service';
import { UserInfoOidc } from '../../core/model/user-info.oidc';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Observable } from 'rxjs';
import { AppService } from '../../app.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  isLoggedIn: boolean;
  userInfoOidc$: Observable<UserInfoOidc>;
  environment = environment;

  ngOnInit() {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfoOidc$ = this.userInfoStore.getUserInfo$();
        this.isLoggedIn = true;
      } else {
        this.isLoggedIn = false;
      }
    });
  }

  constructor(private appService: AppService,
              private keycloakService: KeycloakService,
              private userInfoStore: UserInfoStore,
              private keycloakServiceWrapper: KeycloakServiceWrapper) {
  }

  async doLogout() {
    await this.keycloakService.logout(environment.APP_HOME_URL);
  }

  login() {
    this.keycloakServiceWrapper.login();
  }

  onLogoClick() {
    this.appService.clickLogo(true);
  }

}
