import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { InteractionRequiredAuthError, AuthError } from 'msal';
import { apiConfig } from '../app-config';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  profile: any;

  constructor(private authService: MsalService, private http: HttpClient) { }

  ngOnInit(): void {
    this.getProfile(apiConfig.webApi);
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
