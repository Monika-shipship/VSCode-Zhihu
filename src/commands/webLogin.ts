import * as vscode from 'vscode';
import { Output } from '../global/logger';

/**
 * Command to open web login in browser
 * Opens https://www.zhihu.com/signin in default browser and provides instructions
 */
export async function webLogin(): Promise<void> {
    const loginUrl = 'https://www.zhihu.com/signin';
    
    try {
        // Open the login page in default browser
        await vscode.env.openExternal(vscode.Uri.parse(loginUrl));
        
        // Show helpful message to user
        const action = await vscode.window.showInformationMessage(
            '已在浏览器中打开知乎登录页面。\n' +
            '请在浏览器中完成扫码登录，然后执行 "Zhihu: Import Cookies" 命令导入 Cookie。',
            '打开导入 Cookie 命令'
        );
        
        if (action === '打开导入 Cookie 命令') {
            // Execute the import cookies command
            await vscode.commands.executeCommand('zhihu.importCookies');
        }
        
        Output('已打开浏览器登录页面，请完成登录后导入 Cookie', 'info');
        
    } catch (error) {
        Output(`打开浏览器失败: ${error}`, 'error');
        vscode.window.showErrorMessage('无法打开浏览器，请手动访问: https://www.zhihu.com/signin');
    }
}