import { Component, OnInit } from '@angular/core';
import { BroadcastService, MsalService} from '@azure/msal-angular';
import { Logger, CryptoUtils } from 'msal';
import { isIE } from './app-config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'Azure AD B2C';
  isIframe = false;
  loggedIn = false;

  constructor(private broadcastService: BroadcastService, private authService: MsalService) { }
  
  ngOnInit() {

    this.isIframe = window !== window.parent && !window.opener;
    this.checkAccount();

    // event listeners for authentication status
    this.broadcastService.subscribe('msal:loginSuccess', (payload) => {
      console.log('login succeeded. id token acquired at: ' + new Date().toString());
      console.log(payload);
      this.checkAccount();
    });

    this.broadcastService.subscribe('msal:loginFailure', (payload) => {
      console.log('login failed');
      console.log(payload);
    });

    // redirect callback for redirect flow (IE)
    this.authService.handleRedirectCallback((authError, response) => {
      if (authError) {
        console.error('Redirect Error: ', authError.errorMessage);
        return;
      }

      console.log('Redirect Success: ', response);
    });

    this.authService.setLogger(new Logger((logLevel, message, piiEnabled) => {
      console.log('MSAL Logging: ', message);
    }, {
      correlationId: CryptoUtils.createNewGuid(),
      piiLoggingEnabled: false
    }));
  }

  // other methods
  checkAccount() {
    this.loggedIn = !!this.authService.getAccount();
  }

  login() {
    if (isIE) {
      this.authService.loginRedirect();
    } else {
      this.authService.loginPopup();
    }
  }

  logout() {
    this.authService.logout();
  }
}