import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BroadcastService, MsalService} from '@azure/msal-angular';
import { Logger, CryptoUtils } from 'msal';
import { isIE, b2cPolicies } from './app-config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  subscription1: Subscription;
  subscription2: Subscription;
  subscriptions: Subscription[] = [];
  
  title = 'Azure AD B2C';
  isIframe = false;
  loggedIn = false;

  constructor(private broadcastService: BroadcastService, private authService: MsalService) { }
  
  ngOnInit() {

    this.isIframe = window !== window.parent && !window.opener;
    this.checkAccount();

    // event listeners for authentication status
    this.subscription1 = this.broadcastService.subscribe('msal:loginSuccess', (success) => {

    // We need to reject id tokens that were not issued with the default sign-in policy.
    // "acr" claim in the token tells us what policy is used (NOTE: for new policies (v2.0), use "tfp" instead of "acr")
    // To learn more about b2c tokens, visit https://docs.microsoft.com/en-us/azure/active-directory-b2c/tokens-overview
      if (success.idToken.claims['acr'] === b2cPolicies.names.resetPassword) {
        window.alert("Password has been reset successfully. \nPlease sign-in with your new password");
        return this.authService.logout();
      }

      console.log('login succeeded. id token acquired at: ' + new Date().toString());
      console.log(success);

      this.checkAccount();
    });

    this.subscription2 = this.broadcastService.subscribe('msal:loginFailure', (error) => {
      console.log('login failed');
      console.log(error);

        // Check for forgot password error
        // Learn more about AAD error codes at https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes
        if (error.errorMessage.indexOf('AADB2C90118') > -1) {
          if (isIE) {
            this.authService.loginRedirect(b2cPolicies.authorities.resetPassword);
          } else {
            this.authService.loginPopup(b2cPolicies.authorities.resetPassword);
          }
        }
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

    this.subscriptions.push(this.subscription1);
    this.subscriptions.push(this.subscription2);
  }

  ngOnDestroy(): void {
    if (this.subscriptions.length > 0) {
      this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
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

  editProfile() {
    if (isIE) {
      this.authService.loginRedirect(b2cPolicies.authorities.editProfile);
    } else {
      this.authService.loginPopup(b2cPolicies.authorities.editProfile);
    }
  }
}
