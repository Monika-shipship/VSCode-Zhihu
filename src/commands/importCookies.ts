import * as vscode from 'vscode';
import { getCookies, setCookies, parseCookieString, hasEssentialCookies, getMaskedCookieString } from '../auth/cookies';
import { Output } from '../global/logger';

/**
 * Command to import cookies from user input
 * Accepts cookie string in format: "z_c0=value1; d_c0=value2; _xsrf=value3"
 */
export async function importCookies(context: vscode.ExtensionContext): Promise<void> {
    try {
        // Show input box for cookie string
        const cookieString = await vscode.window.showInputBox({
            prompt: '请粘贴从浏览器导出的 Cookie（格式：z_c0=value; d_c0=value; _xsrf=value）',
            placeHolder: 'z_c0=your_z_c0_value; d_c0=your_d_c0_value; _xsrf=your_xsrf_value',
            ignoreFocusOut: true,
            valueSelection: undefined,
            password: true // Hide the input for security
        });

        if (!cookieString) {
            Output('用户取消了 Cookie 导入', 'info');
            return;
        }

        // Parse the cookie string
        const cookies = parseCookieString(cookieString);
        
        if (Object.keys(cookies).length === 0) {
            vscode.window.showErrorMessage('无效的 Cookie 格式，请检查输入格式。');
            Output('Cookie 格式无效', 'warn');
            return;
        }

        // Check if we have essential cookies
        if (!hasEssentialCookies(cookies)) {
            const proceed = await vscode.window.showWarningMessage(
                '未检测到必要的登录 Cookie（z_c0 或 d_c0），可能无法正常访问 API。是否继续导入？',
                '继续导入', '取消'
            );
            
            if (proceed !== '继续导入') {
                Output('用户取消了 Cookie 导入（缺少必要 Cookie）', 'info');
                return;
            }
        }

        // Save cookies to globalState
        await setCookies(context, cookies);
        
        // Show success message
        const cookieKeys = Object.keys(cookies);
        vscode.window.showInformationMessage(
            `Cookie 导入成功！已导入 ${cookieKeys.length} 个 Cookie: ${cookieKeys.join(', ')}`
        );
        
        Output(`Cookie 导入成功: ${getMaskedCookieString(cookies)}`, 'info');
        
        // Suggest refreshing the feed
        const refresh = await vscode.window.showInformationMessage(
            '建议刷新推荐流以验证登录状态。',
            '刷新推荐'
        );
        
        if (refresh === '刷新推荐') {
            await vscode.commands.executeCommand('zhihu.refreshFeed');
        }
        
    } catch (error) {
        Output(`Cookie 导入失败: ${error}`, 'error');
        vscode.window.showErrorMessage(`Cookie 导入失败: ${error}`);
    }
}

/**
 * Show instructions for getting cookies from browser
 */
export async function showCookieInstructions(): Promise<void> {
    const instructions = `
获取 Cookie 的步骤：

1. 在浏览器中访问 https://www.zhihu.com 并登录
2. 按 F12 打开开发者工具
3. 进入 Application 标签（Chrome）或 Storage 标签（Firefox）
4. 在左侧找到 Cookies → https://www.zhihu.com
5. 复制以下 Cookie 的值：
   - z_c0（最重要的登录令牌）
   - d_c0（设备标识）
   - _xsrf（防跨站攻击令牌）
   - q_c1（可选）

6. 按格式拼接：z_c0=值1; d_c0=值2; _xsrf=值3

注意：
- 请勿在不信任的环境中操作
- Cookie 包含敏感信息，请妥善保管
- 如果登录失效，请重新获取 Cookie
    `;

    await vscode.window.showInformationMessage(
        instructions,
        { modal: true }
    );
}