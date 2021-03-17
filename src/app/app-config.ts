import {
    IPublicClientApplication,
    PublicClientApplication,
    InteractionType,
    BrowserCacheLocation,
    LogLevel
} from '@azure/msal-browser';

import {
    MsalInterceptorConfiguration,
    MsalGuardConfiguration,
} from '@azure/msal-angular';

// this checks if the app is running on IE
export const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1;

/** =================== REGIONS ====================
 * 1) B2C policies and user flows
 * 2) Web API configuration parameters
 * 3) Authentication configuration parameters
 * 4) MSAL-Angular specific configuration parameters
 * =================================================
 */

// #region 1) B2C policies and user flows
/**
 * Enter here the user flows and custom policies for your B2C application,
 * To learn more about user flows, visit https://docs.microsoft.com/en-us/azure/active-directory-b2c/user-flow-overview
 * To learn more about custom policies, visit https://docs.microsoft.com/en-us/azure/active-directory-b2c/custom-policy-overview
 */
export const b2cPolicies = {
    names: {
        signUpSignIn: 'b2c_1_susi',
        resetPassword: 'b2c_1_reset',
        editProfile: 'b2c_1_profile'
    },
    authorities: {
        signUpSignIn: {
            authority: 'https://myDemoExample.b2clogin.com/myDemoExample.onmicrosoft.com/b2c_1_susi'
        },
        resetPassword: {
            authority: 'https://myDemoExample.b2clogin.com/myDemoExample.onmicrosoft.com/b2c_1_reset'
        },
        editProfile: {
            authority: 'https://myDemoExample.b2clogin.com/myDemoExample.onmicrosoft.com/b2c_1_profile'
        }
    },
    knownAuthorities: ['myDemoExample.b2clogin.com'],
    clientId: '5543e837-03f5-49fb-9fb5-b4e4ba528974',
    redirectUri: 'http://localhost:6420/'
};
// #endregion

// #region 2) Web API Configuration
/**
 * Enter here the coordinates of your Web API and scopes for access token request
 * The current application coordinates were pre-registered in a B2C tenant.
 */
export const api1Config: { scopes: string[]; uri: string } = {
    scopes: ['https://myDemoExample.onmicrosoft.com/profile/access'],
    uri: 'https://myDemoExample.onmicrosoft.com/profile'
};
// export const api2Config: { scopes: string[]; uri: string } = {
//     scopes: ['https://myDemoExample.onmicrosoft.com/contact/access'],
//     uri: 'https://myDemoExample.onmicrosoft.com/contact'
// };
// #endregion

export function loggerCallback(logLevel: LogLevel, message: string) {
    console.log(message);
}

// #region 3) MSALInstanceFactory
export function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication({
        auth: {
            clientId: b2cPolicies.clientId,
            authority: b2cPolicies.authorities.signUpSignIn.authority,
            redirectUri: b2cPolicies.redirectUri,
            postLogoutRedirectUri: b2cPolicies.redirectUri,
            navigateToLoginRequestUrl: true,
            knownAuthorities: b2cPolicies.knownAuthorities
        },
        cache: {
            cacheLocation: BrowserCacheLocation.LocalStorage,
            storeAuthStateInCookie: isIE, // set to true for IE 11
        },
        system: {
            loggerOptions: {
                loggerCallback,
                logLevel: LogLevel.Info,
                piiLoggingEnabled: false
            }
        }
    });
}

// #region 4) MSALGuardConfigFactory
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
    return {
        interactionType: InteractionType.Popup,
        authRequest: {
            scopes: [
                ...api1Config.scopes,
                //...api2Config.scopes
            ]
        }
    };
}
// #endregion

// #region 5) MSALInterceptorConfigFactory
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
    const protectedResourceMap = new Map<string, Array<string>>();
    protectedResourceMap.set(api1Config.uri, api1Config.scopes);
    //protectedResourceMap.set(api2Config.uri, api2Config.scopes);
    return {
        interactionType: InteractionType.Popup,
        protectedResourceMap,
    };
}
