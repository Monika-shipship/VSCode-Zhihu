import * as vscode from 'vscode';

interface ZhihuCookies {
    z_c0?: string;
    d_c0?: string;
    q_c1?: string;
    _xsrf?: string;
    [key: string]: string | undefined;
}

const COOKIES_KEY = 'zhihu.cookies';

/**
 * Get cookies from VSCode globalState
 */
export function getCookies(context: vscode.ExtensionContext): ZhihuCookies {
    return context.globalState.get<ZhihuCookies>(COOKIES_KEY) || {};
}

/**
 * Set cookies to VSCode globalState
 */
export async function setCookies(context: vscode.ExtensionContext, cookies: ZhihuCookies): Promise<void> {
    await context.globalState.update(COOKIES_KEY, cookies);
}

/**
 * Clear all stored cookies
 */
export async function clearCookies(context: vscode.ExtensionContext): Promise<void> {
    await context.globalState.update(COOKIES_KEY, undefined);
}

/**
 * Convert cookies object to Cookie header string
 */
export function toCookieHeader(cookies: ZhihuCookies): string {
    return Object.entries(cookies)
        .filter(([key, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
}

/**
 * Parse cookie string (from user input) to cookies object
 * Supports formats like: "z_c0=value1; d_c0=value2; _xsrf=value3"
 */
export function parseCookieString(cookieStr: string): ZhihuCookies {
    const cookies: ZhihuCookies = {};
    
    if (!cookieStr.trim()) {
        return cookies;
    }
    
    // Split by semicolon and parse each cookie
    cookieStr.split(';').forEach(cookie => {
        const [key, ...valueParts] = cookie.split('=');
        if (key && valueParts.length > 0) {
            const trimmedKey = key.trim();
            const value = valueParts.join('=').trim(); // In case value contains '='
            if (trimmedKey && value) {
                cookies[trimmedKey] = value;
            }
        }
    });
    
    return cookies;
}

/**
 * Check if we have essential cookies for authentication
 */
export function hasEssentialCookies(cookies: ZhihuCookies): boolean {
    // Check for at least z_c0 or d_c0 which are typically required for auth
    return !!(cookies.z_c0 || cookies.d_c0);
}

/**
 * Get masked cookie string for logging (hides sensitive values)
 */
export function getMaskedCookieString(cookies: ZhihuCookies): string {
    return Object.entries(cookies)
        .filter(([key, value]) => value !== undefined && value !== '')
        .map(([key, value]) => {
            const maskedValue = value!.length > 8 ? 
                value!.substring(0, 4) + '****' + value!.substring(value!.length - 4) : 
                '****';
            return `${key}=${maskedValue}`;
        })
        .join('; ');
}