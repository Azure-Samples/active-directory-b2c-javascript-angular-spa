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
  tokenAcquired = false;
  accessToken: string;
  apiResponse: any;

  constructor(private broadcastService: BroadcastService, private authService: MsalService, private http: HttpClient) { }

  ngOnInit() {
    this.isIframe = window !== window.parent && !window.opener;

    this.checkAccount();

    this.broadcastService.subscribe('msal:loginSuccess', (payload) => {
      console.log('login succeeded');
      this.checkAccount();
    });

    this.broadcastService.subscribe('msal:loginFailure', (payload) => {
      console.log('login failed');
    });
      
    this.broadcastService.subscribe("msal:acquireTokenSuccess", (payload) => {
      console.log('access token acquired: ' + new Date().toString());
      this.tokenAcquired = true;
      this.accessToken = payload.accessToken;
    });
 
    this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
      console.log('access token acquisition fails');
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
        }).catch(err => console.log(err));
    }
  }

  callAPI(accessToken:string) {
    let config = { headers: { Authorization: 'Bearer ' + accessToken } };

    console.log('API call made at: ' + new Date().toString());
    
    this.http.get(apiConfig.webApi, config).toPromise()
      .then(res => {
        this.apiResponse = res;
        console.log('API responded at: ' + new Date().toString());
      }).catch(err => console.log(err));
  }
}