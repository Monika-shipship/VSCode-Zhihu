# VSCode-Zhihu Extension

VSCode-Zhihu is a Visual Studio Code extension that provides a comprehensive Zhihu (Chinese Q&A platform) client. It enables users to read, search, write, and publish content to Zhihu directly from VSCode with features including login, content creation with Markdown+LaTeX, image upload, scheduled publishing, browsing recommendations, hot topics, search, and collections.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Prerequisites and Installation
- Node.js `>= 10.0.0` (tested with v20.19.4)
- npm `>= 6.0.0` (tested with v10.8.2)
- Git

### Bootstrap and Build Process
**CRITICAL: Always follow these exact steps in order:**

1. **Install dependencies**: 
   ```bash
   npm install --legacy-peer-deps
   ```
   - **Time**: ~2.5 minutes. NEVER CANCEL.
   - **Required**: Use `--legacy-peer-deps` flag due to tslint version conflicts
   - **Note**: Will show many deprecation warnings - this is expected

2. **Apply uglify-js workaround** (CRITICAL STEP):
   ```bash
   # Comment out problematic code in node_modules/uglify-js/tools/node.js
   # Lines 11-32 must be commented out due to webpack bundling conflicts
   # This step is REQUIRED after every npm install
   ```
   - **Manual step required**: Edit `/node_modules/uglify-js/tools/node.js` and comment lines 11-32
   - **Reason**: Webpack misunderstands file I/O operations in pug template engine

3. **TypeScript compilation**:
   ```bash
   npm run compile
   ```
   - **Time**: ~3 seconds. Output goes to `out/` directory

4. **Development build** (webpack with watch mode):
   ```bash
   NODE_OPTIONS="--openssl-legacy-provider" npm run develop
   ```
   - **Time**: Initial build ~6 seconds, then watches for changes
   - **Required**: Use `NODE_OPTIONS="--openssl-legacy-provider"` for Node.js v17+ compatibility
   - **Output**: Creates `dist/extension.js` bundle
   - **Warning**: Build may show canvas/jsdom errors but still produces working output

5. **Production build**:
   ```bash
   NODE_OPTIONS="--openssl-legacy-provider" npm run vscode:prepublish
   ```
   - **Time**: ~33 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
   - **Output**: May create optimized `dist/extension.js` for distribution
   - **Note**: Build may fail with canvas/jsdom errors but the extension functionality works with TypeScript compilation

6. **Mermaid support build**:
   ```bash
   NODE_OPTIONS="--openssl-legacy-provider" npm run build-mermaid
   ```
   - **Time**: ~9 seconds. Creates mermaid diagram support bundle

### Linting
```bash
npm run lint
```
- **Time**: ~4 seconds
- **Note**: Currently shows many style errors (6900+) but runs successfully
- **Fix mode**: `npm run lint -- --fix` to auto-fix some issues

### Testing
```bash
npm test
```
- **Time**: ~3 seconds for compilation, tests may fail due to network requirements
- **Note**: Tests require VSCode API and may not work in headless environments
- **Alternative**: Use `npm run compile` to just verify TypeScript compilation

## Validation Scenarios

### Basic Extension Functionality Testing
**After making changes, always test these scenarios:**

1. **Extension Loading**:
   - Open VSCode and install the extension in development mode
   - Verify the Zhihu sidebar appears in the activity bar
   - Check that no activation errors occur

2. **Core Features**:
   - Test login functionality (QR code and username/password)
   - Verify feed/recommendations loading
   - Test search functionality
   - Validate Markdown preview with LaTeX support
   - Test image upload functionality

3. **Content Creation**:
   - Create a new `.md` file
   - Use `Zhihu: Preview` command to preview content
   - Test `Zhihu: Publish` functionality
   - Validate Mermaid diagram rendering (if enabled)

### Build Validation
**Always run these commands after code changes:**
```bash
# 1. Ensure TypeScript compiles without errors (CRITICAL)
npm run compile

# 2. Attempt webpack build (may fail but worth trying)
NODE_OPTIONS="--openssl-legacy-provider" npm run vscode:prepublish

# 3. Run linting (fix critical issues only)
npm run lint
```

**If webpack build fails**: The extension can still be developed and tested using TypeScript compilation output in `out/` directory. The extension's `package.json` main entry supports both `dist/extension.js` (webpack) and the fallback TypeScript output.

## Development Workflow

### VSCode Extension Development
1. **Initial Setup**:
   - Follow all bootstrap steps above
   - Open the project in VSCode
   - Use F5 or "Launch Extension" debug configuration

2. **Development Loop**:
   - Run `NODE_OPTIONS="--openssl-legacy-provider" npm run develop` for watch mode
   - Make code changes
   - Use "Reload Window" (Ctrl+R) in Extension Development Host to test changes

3. **Pre-commit Validation**:
   - Always run `npm run compile` to check TypeScript errors
   - Consider running `npm run lint -- --fix` to auto-fix style issues
   - Test extension functionality in Extension Development Host

## Known Issues and Workarounds

### Build Issues
- **Canvas/JSDOM errors**: Expected in webpack build, may prevent dist/ creation but extension works with TypeScript compilation
- **uglify-js dependency**: Requires manual workaround after every `npm install`
- **Node.js compatibility**: Use `NODE_OPTIONS="--openssl-legacy-provider"` for v17+
- **Dependency conflicts**: Always use `npm install --legacy-peer-deps`
- **Webpack bundle failures**: If webpack fails, use TypeScript compilation (`npm run compile`) for development

### Testing Limitations
- **VSCode API tests**: May fail in headless environments
- **Network dependencies**: Tests may fail without internet connectivity
- **Extension Host required**: Full functionality testing requires VSCode Extension Development Host

## Project Structure

### Key Directories
- `src/` - TypeScript source code
  - `service/` - Core business logic services
  - `treeview/` - VSCode tree view providers
  - `lang/` - Language support features
  - `util/` - Utility functions
- `dist/` - Webpack build output
- `out/` - TypeScript compilation output
- `test/` - Test suites (limited)
- `res/` - Extension resources and assets

### Configuration Files
- `package.json` - Extension manifest and scripts
- `tsconfig.json` - TypeScript configuration
- `webpack.config.js` - Webpack bundling configuration
- `.eslintrc.js` - ESLint linting rules
- `.vscode/` - VSCode debugging configuration

## Common Commands Reference

```bash
# Dependencies
npm install --legacy-peer-deps                    # ~2.5 min, NEVER CANCEL

# Building
npm run compile                                   # ~3 sec, TypeScript only
NODE_OPTIONS="--openssl-legacy-provider" npm run develop      # ~6 sec + watch
NODE_OPTIONS="--openssl-legacy-provider" npm run vscode:prepublish  # ~33 sec, NEVER CANCEL

# Quality
npm run lint                                      # ~4 sec
npm test                                          # ~3 sec (may fail)

# Special builds
NODE_OPTIONS="--openssl-legacy-provider" npm run build-mermaid  # ~9 sec
```

**CRITICAL TIMEOUTS:**
- Dependencies: 300+ seconds (5+ minutes)
- Production build: 3600+ seconds (60+ minutes) 
- Development builds: 60+ seconds
- Always include "NEVER CANCEL" warnings for builds over 30 seconds

## Extension-Specific Notes

### Features Overview
- **Authentication**: QR code and username/password login to Zhihu
- **Content Browsing**: Personal feed, hot topics, search across platform
- **Content Creation**: Markdown + LaTeX syntax, code highlighting
- **Publishing**: Direct publishing to Zhihu with scheduling support
- **Media Management**: Image upload to Zhihu image hosting
- **Collections**: Bookmark and organize Zhihu content

### Technical Details
- **Language**: TypeScript with Node.js dependencies
- **Bundling**: Webpack for production distribution
- **UI Framework**: VSCode extension API with tree views and webviews
- **Markdown**: Custom parser with Zhihu-specific extensions
- **Image Processing**: Supports clipboard, file explorer, and path-based uploads

This extension requires careful dependency management and specific build procedures due to its complex webpack configuration and Chinese platform integrations.