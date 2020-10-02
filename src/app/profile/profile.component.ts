import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MsalService, BroadcastService } from '@azure/msal-angular';
import { InteractionRequiredAuthError, AuthError } from 'msal';
import { apiConfig } from '../app-config';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  subscription1: Subscription;
  subscription2: Subscription;
  subscriptions: Subscription[] = [];

  profile: any;

  constructor(private broadcastService: BroadcastService, private authService: MsalService, private http: HttpClient) { }

  ngOnInit(): void {
    this.getProfile(apiConfig.webApi);

    this.subscription1 = this.broadcastService.subscribe('msal:acquireTokenSuccess', (payload) => {
      console.log('access token acquired at: ' + new Date().toString());
      console.log(payload);
    });
 
    this.subscription2 = this.broadcastService.subscribe('msal:acquireTokenFailure', (payload) => {
      console.log('access token acquisition fails');
      console.log(payload);
    });

    this.subscriptions.push(this.subscription1);
    this.subscriptions.push(this.subscription2);
  }

  ngOnDestroy(): void {
    if (this.subscriptions.length > 0) {
      this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
  }

  getProfile(url: string) {
    this.http.get(url).subscribe({
        next: (profile) => {
          this.profile = profile;
        },
        error: (err: AuthError) => {
          // If there is an interaction required error,
          // call one of the interactive methods and then make the request again.
          if (InteractionRequiredAuthError.isInteractionRequiredError(err.errorCode)) {
            this.authService.acquireTokenPopup({
              scopes: this.authService.getScopesForEndpoint(url)
            }).then(() => {
              this.http.get(url).toPromise()
                .then(profile => {
                  this.profile = profile;
                });
            });
          }
        }
      });
  }
}
