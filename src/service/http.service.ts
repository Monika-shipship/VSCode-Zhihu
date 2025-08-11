import * as httpClient from "request-promise";
import * as vscode from "vscode";
import { Cookie, CookieJar, Store } from "tough-cookie";
import { DefaultHTTPHeader } from "../const/HTTP";
import { ZhihuDomain } from "../const/URL";
import {
    getCookieJar,
    getCookieStore,
    clearCookieStore,
} from "../global/cookie";
import { getGlobalState } from "../global/globa-var";
import { Output } from "../global/logger";
import { IProfile } from "../model/target/target";
import { getCookies, toCookieHeader } from "../auth/cookies";

interface CacheItem {
    url: string;
    data: any;
}

export class HttpService {
    public profile: IProfile;
    public xsrfToken: string;
    public cache = {};

    constructor() {}

    public async sendRequest(options): Promise<any> {
        if (options.headers == undefined) {
            options.headers = DefaultHTTPHeader;
        }
        
        // Get cookies from globalState (imported cookies) first, then fallback to file cookies
        let cookieHeader = '';
        try {
            const globalState = getGlobalState();
            if (globalState) {
                const importedCookies = getCookies({ globalState } as any);
                if (importedCookies && Object.keys(importedCookies).length > 0) {
                    cookieHeader = toCookieHeader(importedCookies);
                    Output(`Using imported cookies: ${Object.keys(importedCookies).join(', ')}`, 'info');
                    
                    // Extract _xsrf token from imported cookies
                    if (importedCookies._xsrf) {
                        this.xsrfToken = importedCookies._xsrf;
                    }
                }
            }
            
            // If no imported cookies, fallback to file-based cookies
            if (!cookieHeader) {
                cookieHeader = getCookieJar().getCookieStringSync(options.uri);
            }
            
            options.headers["cookie"] = cookieHeader;
        } catch (error) {
            console.log('Error getting cookies:', error);
            // Fallback to existing cookie system
            try {
                options.headers["cookie"] = getCookieJar().getCookieStringSync(options.uri);
            } catch (fallbackError) {
                console.log('Fallback cookie error:', fallbackError);
            }
        }
        
        if (this.xsrfToken) {
            options.headers["x-xsrftoken"] = this.xsrfToken;
        }
		// TODO 暂时删除导致json乱码的压缩方式
        if (!options.isGzip) {
            delete options.headers["accept-encoding"];
        }
        // options.headers['cookie'] = getCookieJar().getCookieStringSync('www.zhihu.com');
        // headers['cookie'] = cookieService.getCookieString(options.uri);
        var returnBody;
        if (
            options.resolveWithFullResponse == undefined ||
            options.resolveWithFullResponse == false
        ) {
            returnBody = true;
        } else {
            returnBody = false;
        }
        options.resolveWithFullResponse = true;

        options.simple = false;

        var resp;
        if (!this.cache) this.cache = {};
        try {
            if (this.cache[options.uri]) {
                // cache hit
                resp = this.cache[options.uri];
            } else {
                // cache miss
                resp = await httpClient(options);
                if (resp.headers["set-cookie"]) {
                    resp.headers["set-cookie"]
                        .map((c) => Cookie.parse(c))
                        .forEach((c) => {
                            // delete c.domain
                            getCookieJar().setCookieSync(c, options.uri);
                            getCookieStore().findCookie(
                                ZhihuDomain,
                                "/",
                                "_xsrf",
                                (err, c) => {
                                    if (c) {
                                        this.xsrfToken = c.value;
                                    }
                                }
                            );
                        });
                }
                if (options.enableCache) {
                    this.cache[options.uri] = resp;
                }
            }
            
            // Check for authentication failures that should suggest migration
            if (resp && (resp.statusCode === 401 || resp.statusCode === 403)) {
                this.handleAuthenticationFailure(resp, options.uri);
            } else if (resp && resp.body) {
                // Check response body for specific error codes
                const body = typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body);
                if (body.includes('40352') || body.includes('need_login') || body.includes('unhuman')) {
                    this.handleAuthenticationFailure(resp, options.uri);
                }
            }
            
        } catch (error) {
            // vscode.window.showInformationMessage('请求错误');
            Output(error);
            return Promise.resolve(null);
        }
        if (returnBody) {
            return Promise.resolve(resp.body);
        } else {
            return Promise.resolve(resp);
        }
    }

    public clearCookie(domain?: string) {
        if (domain == undefined) {
            getCookieStore().removeCookies(ZhihuDomain, null, (err) =>
                console.log(err)
            );
            clearCookieStore();
        }
        this.xsrfToken = undefined;
    }

    public clearCache() {
        this.cache = {};
    }
    
    /**
     * Handle authentication failures and suggest migration to new login
     */
    private handleAuthenticationFailure(resp: any, uri: string): void {
        // Throttle notifications to avoid spam
        const now = Date.now();
        const lastNotification = this.lastAuthFailureNotification || 0;
        if (now - lastNotification < 60000) { // 1 minute throttle
            return;
        }
        this.lastAuthFailureNotification = now;
        
        Output(`Authentication failure detected for ${uri}: ${resp.statusCode}`, 'warn');
        
        // Show user-friendly message based on error type
        let message = '登录状态已失效，请重新登录。';
        if (resp.statusCode === 401) {
            message = '登录已过期，请重新登录。';
        } else if (resp.statusCode === 403) {
            message = '访问被拒绝，可能需要重新登录。';
        }
        
        // Use vscode.window in a way that doesn't block the HTTP response
        setImmediate(() => {
            vscode.window.showWarningMessage(
                message,
                '浏览器登录', '导入 Cookie'
            ).then(action => {
                if (action === '浏览器登录') {
                    vscode.commands.executeCommand('zhihu.webLogin');
                } else if (action === '导入 Cookie') {
                    vscode.commands.executeCommand('zhihu.importCookies');
                }
            });
        });
    }
    
    private lastAuthFailureNotification?: number;
}

var httpService = new HttpService();

export const sendRequest = httpService.sendRequest;
export const clearCookie = httpService.clearCookie;
export const clearCache = httpService.clearCache;
