import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import {
  MsalService,
  MsalBroadcastService,
} from '@azure/msal-angular';
import {
  EventMessage,
  EventType,
  AuthError,
  InteractionRequiredAuthError
} from '@azure/msal-browser';
import { api1Config } from '../app-config';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  subscriptions: Subscription[] = [];

  profile: any;

  constructor(private msalBroadcastService: MsalBroadcastService, private authService: MsalService, private http: HttpClient) { }

  ngOnInit(): void {
    this.getProfile(api1Config.uri);
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
              scopes: [...api1Config.scopes]
            }).subscribe(() => {
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
