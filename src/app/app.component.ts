import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import {
  MsalService,
  MsalBroadcastService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration
} from '@azure/msal-angular';
import {
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionType,
  PopupRequest,
  RedirectRequest,
  AuthError
} from '@azure/msal-browser';
import { isIE, b2cPolicies } from './app-config';
interface IdTokenClaims extends AuthenticationResult {
  idTokenClaims: {
    acr?: string
  }
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  title = 'Azure AD B2C';
  isIframe = false;
  loggedIn = false;

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService) { }

  ngOnInit() {

    let loginSuccessSubscription: Subscription;
    let loginFailureSubscription: Subscription;
    let tokenSuccessSubscription: Subscription;
    let tokenFailureSubscription: Subscription;

    this.isIframe = window !== window.parent && !window.opener;
    this.checkAccount();

    // event listeners for authentication status
    loginSuccessSubscription = this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS)
      ).subscribe((result: EventMessage) => {
        const success: IdTokenClaims = <AuthenticationResult>result.payload;
        if (success) {
          // We need to reject id tokens that were not issued with the default sign-in policy.
          // "acr" claim in the token tells us what policy is used (NOTE: for new policies (v2.0), use "tfp" instead of "acr")
          // To learn more about b2c tokens, visit https://docs.microsoft.com/en-us/azure/active-directory-b2c/tokens-overview
          if (success.idTokenClaims['acr'] === b2cPolicies.names.resetPassword) {
            window.alert('Password has been reset successfully. \nPlease sign-in with your new password');
            return this.authService.logout();
          } else if (success.idTokenClaims['acr'] === b2cPolicies.names.editProfile) {
            window.alert('Profile has been updated successfully. \nPlease sign-in again.');
            return this.authService.logout();
          }

          console.log('login succeeded. id token acquired at: ' + new Date().toString());
          console.log(success);

          this.checkAccount();
        }
      });

    loginFailureSubscription = this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_FAILURE || msg.eventType === EventType.ACQUIRE_TOKEN_FAILURE)
      )
      .subscribe((result: EventMessage) => {
        const error = result.error;
        console.log('login failed');
        console.log(error);

        if (error.message) {
          if (error instanceof AuthError) {
            // Check for forgot password error
            // Learn more about AAD error codes at https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes
            if (error.message.indexOf('AADB2C90118') > -1) {
              // login request with reset authority
              let resetPasswordFlowRequest = {
                scopes: ["openid"],
                authority: b2cPolicies.authorities.resetPassword.authority,
              };

              this.login(resetPasswordFlowRequest);
            }
          }
        }
      });

    tokenSuccessSubscription = this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS)
      ).subscribe((result: EventMessage) => {
        console.log('access token acquired at: ' + new Date().toString());
        console.log(result.payload);
      });

    tokenFailureSubscription = this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.ACQUIRE_TOKEN_FAILURE)
      ).subscribe((result: EventMessage) => {
        console.log('access token acquisition fails');
        console.log(result.payload);
      });

    this.subscriptions.push(loginSuccessSubscription);
    this.subscriptions.push(loginFailureSubscription);
    this.subscriptions.push(tokenSuccessSubscription);
    this.subscriptions.push(tokenFailureSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  // other methods
  checkAccount() {
    this.loggedIn = this.authService.instance.getAllAccounts().length > 0;
  }

  login(userFlowRequest?: RedirectRequest | PopupRequest) {
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      if (this.msalGuardConfig.authRequest) {
        this.authService.loginPopup({ ...this.msalGuardConfig.authRequest, ...userFlowRequest } as PopupRequest);
      } else {
        this.authService.loginPopup(userFlowRequest);
      }
    } else {
      if (this.msalGuardConfig.authRequest) {
        this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest, ...userFlowRequest } as RedirectRequest);
      } else {
        this.authService.loginRedirect(userFlowRequest);
      }
    }
  }

  logout() {
    this.authService.logout();
  }

  editProfile() {
    let editProfileFlowRequest = {
      scopes: ["openid"],
      authority: b2cPolicies.authorities.editProfile.authority,
    };
    this.login(editProfileFlowRequest);
  }
}
