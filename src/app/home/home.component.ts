import { Component, OnInit } from '@angular/core';
import { BroadcastService, MsalService} from '@azure/msal-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  loggedIn = false;

  constructor(private broadcastService: BroadcastService, private authService: MsalService, private http: HttpClient) { }

  ngOnInit() {
    this.checkAccount();

    this.broadcastService.subscribe('msal:loginSuccess', (payload) => {
      this.checkAccount();
    });

    this.broadcastService.subscribe('msal:acquireTokenSuccess', (payload) => {
      console.log('access token acquired: ' + new Date().toString());
    });
 
    this.broadcastService.subscribe('msal:acquireTokenFailure', (payload) => {
      console.log('access token acquisition fails');
    });

    // redirect callback for redirect flow (IE)
    this.authService.handleRedirectCallback((authError, response) => {
      if (authError) {
        console.error('Redirect Error: ', authError.errorMessage);
        return;
      }

      console.log('Redirect Success: ', response.accessToken);
    });
  }

  // other methods
  checkAccount() {
    this.loggedIn = !!this.authService.getAccount();
  }
}
