import { Component, OnInit } from '@angular/core';
import { BroadcastService, MsalService} from '@azure/msal-angular';
import { HttpClient } from '@angular/common/http';
import { apiConfig, tokenRequest, isIE} from '../config';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  loggedIn = false;
  tokenAcquired = false;
  apiResponse: any;

  constructor(private broadcastService: BroadcastService, private authService: MsalService, private http: HttpClient) { }

  ngOnInit() {
    this.checkAccount();

    this.broadcastService.subscribe('msal:loginSuccess', (payload) => {
      this.checkAccount();
    });

    this.broadcastService.subscribe("msal:acquireTokenSuccess", (payload) => {
      console.log('access token acquired: ' + new Date().toString());
      this.tokenAcquired = true;
    });
 
    this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
      console.log('access token acquisition fails');
      this.tokenAcquired = false;
    });

    // redirect callback for redirect flow (IE)
    this.authService.handleRedirectCallback((authError, response) => {
      if (authError) {
        console.error('Redirect Error: ', authError.errorMessage);
        return;
      }

      console.log('Redirect Success: ', response.accessToken);
      this.tokenAcquired = true;
    });
  }

  // other methods
  checkAccount() {
    this.loggedIn = !!this.authService.getAccount();
  }

  getProfile() {
    if (isIE) {
      this.authService.loginRedirect(tokenRequest);
    } else {
      this.authService.loginPopup(tokenRequest)
        .then(res => {
          this.callAPI(apiConfig.webApi)
        })
        .catch(err => console.log(err));
    }
  }

  callAPI(url:string) {
    console.log('API call made at: ' + new Date().toString());

    this.http.get(url).toPromise()
      .then(res => {
        this.apiResponse = res;
        console.log('API responded at: ' + new Date().toString());
      }).catch(err => console.log(err));
  }

}
