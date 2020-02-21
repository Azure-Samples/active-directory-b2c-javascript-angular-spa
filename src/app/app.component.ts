import { Component, OnInit } from '@angular/core';
import { BroadcastService, MsalService } from '@azure/msal-angular';
import { Logger, CryptoUtils } from 'msal';
import { HttpClient } from '@angular/common/http';
import { apiConfig, loginRequest, tokenRequest, isIE} from './appConfig.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Azure AD B2C';
  isIframe = false;
  loggedIn = false;
  accessToken: string;
  tokenAcquired = false;
  apiResponse: any;

  constructor(private broadcastService: BroadcastService, private authService: MsalService, private http: HttpClient) { }

  ngOnInit() {
    this.isIframe = window !== window.parent && !window.opener;

    this.checkAccount();

    this.broadcastService.subscribe('msal:loginSuccess', (payload) => {
      this.checkAccount();
    });

    this.broadcastService.subscribe('msal:loginFailure', (payload) => {
      this.checkAccount();
    });
      
    this.broadcastService.subscribe("msal:acquireTokenSuccess", (payload) => {
      this.tokenAcquired = true;
      this.accessToken = payload.accessToken;
    });
 
    this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
    });

    this.authService.handleRedirectCallback((authError, response) => {
      if (authError) {
        console.error('Redirect Error: ', authError.errorMessage);
        return;
      }

      console.log('Redirect Success: ', response.accessToken);
      this.tokenAcquired = true;
      this.callAPI(response.accessToken)
    });

    this.authService.setLogger(new Logger((logLevel, message, piiEnabled) => {
      console.log('MSAL Logging: ', message);
    }, {
      correlationId: CryptoUtils.createNewGuid(),
      piiLoggingEnabled: false
    }));
  }

  checkAccount() {
    this.loggedIn = !!this.authService.getAccount();
  }

  login() {
    if (isIE) {
      this.authService.loginRedirect(loginRequest);
    } else {
      this.authService.loginPopup(loginRequest);
    }
  }

  logout() {
    this.authService.logout();
  }

  getProfile() {
    if (isIE) {
      this.authService.loginRedirect(tokenRequest);
    } else {
      this.authService.loginPopup(tokenRequest)
        .then(res => {
          this.callAPI(this.accessToken)
        });
    }
  }

  callAPI(accessToken:string) {
    let config = { headers: { Authorization: 'Bearer ' + accessToken } };

    this.http.get(apiConfig.webApi, config).toPromise()
      .then(res => {
        this.apiResponse = res;
      }).catch(err => console.log('MSAL Logging: ', err));
  }
}