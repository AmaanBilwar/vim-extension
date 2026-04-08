## Vim extension i wrote to browser the web 
 
i tried using multiple vim extensions and none of them seemed to work, either behind a pay-wall, or unconfigurable keybinds or just me using a secure browser like Helium so I don't want to share my data. 

So i wrote my own. try to use it. Let me know if you like it.

## Usage 

### Keybinds (normal mode)

| Keys | Action |
| --- | --- |
| `j` / `k` | Scroll down / up |
| `h` / `l` | Scroll left / right |
| `d` / `u` | Half-page down / up |
| `Ctrl+d` / `Ctrl+u` | Half-page down / up |
| `gg` / `G` | Jump to top / bottom of page |
| `f` | Enter hint mode for clickable elements |
| `/` | Open find mode |
| `n` / `N` | Next / previous match for last search |
| `Esc` | Blur active input (insert mode) / exit hint or find mode |

### Keybinds (hint mode)

| Keys | Action |
| --- | --- |
| `a-z` | Filter visible hint labels |
| `Backspace` | Remove the last typed hint character |
| `Enter` | Confirm the exact/remaining hint |
| `Esc` | Exit hint mode |

### Keybinds (find mode)

| Keys | Action |
| --- | --- |
| `a-z` (or any typed character) | Build the search query |
| `Backspace` | Remove last search character |
| `Enter` / `Shift+Enter` | Next / previous result |
| `Esc` | Exit find mode |

### Getting Started 
#### Developing and building
This template comes with build configs for both Chrome and Firefox. Running
`dev` or `build` commands without specifying the browser target will build
for Chrome by default.

1. Clone this repository or click "Use this template"
2. Change `name` and `description` in `manifest.json`
3. Run `yarn` or `npm i` (check your node version >= 16)
4. Run `yarn dev[:chrome|:firefox]`, or `npm run dev[:chrome|:firefox]`

Running a `dev` command will build your extension and watch for changes in the 
source files. Changing the source files will refresh the corresponding 
`dist_<chrome|firefox>` folder.

To create an optimized production build, run `yarn build[:chrome|:firefox]`, or
`npm run build[:chrome|:firefox]`.

#### Load your extension
For Chrome
1. Open - Chrome browser
2. Access - [chrome://extensions](chrome://extensions)
3. Tick - Developer mode
4. Find - Load unpacked extension
5. Select - `dist_chrome` folder in this project (after dev or build)

For Firefox
1. Open - Firefox browser
2. Access - [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
3. Click - Load temporary Add-on
4. Select - any file in `dist_firefox` folder (i.e. `manifest.json`) in this project (after dev or build)

### Customization 
#### Adding / removing pages
The template includes source code for **all** of the extension pages (i.e. New Tab, Dev Tools, Popup, Side Panel
etc.). You will likely have to customize it to fit your needs.

E.g. you don't want the newtab page to activate whenever you open a new tab:
1. remove the directory `newtab` and its contents in `src/pages`
2. remove `chrome_url_overrides: { newtab: 'src/pages/newtab/index.html' },` in `manifest.json`

Some pages like the "Side Panel" don't work the exact same in Chrome and Firefox. While this template includes
the source code for the side panel, it won't automatically be included in the dist file to prevent cross browser
build warnings.

To include the side panel for Chrome add the following to the `manifest.json`:

```typescript
{
  "manifest_version": 3,
  // ...
  "permissions": [
    "activeTab",
    "sidePanel" // <-- permission for sidepanel
  ],
  // ...
  "side_panel": {
    "default_path": "src/pages/panel/index.html" // <-- tell vite to include it in the build files
  },
  // ...
}
```

If you need to declare pages in addition to the manifest pages, e.g. a custom `app` page, create a 
new folder in the `pages` directory and add the corresponding `.html`, `.tsx` and `.css` 
files (see `options/*` for an example to copy). Then include the root html in the `vite.config.base.ts` 
file under `build.rollupOptions.input` like so:

```typescript
// ...
build: {
   rollupOptions: {
      input: {
         app: resolve(pagesDir, "app", "index.html"),
      },
      output: {
         entryFileNames: (chunk) => `src/pages/${chunk.name}/index.js`,
      },
   },
}
// ...
```

#### Styling
CSS files in the `src/pages/*` directories are not necessary. They are left in there in case you want 
to use it in combination with Tailwind CSS. **Feel free to delete them**.

Tailwind can be configured, themed and extended according to the [docs](https://tailwindcss.com/docs/theme).

#### Internationalization (i18n)
To enable internationalization set the `localize` flag in the `vite.config.base.ts` to `true`.

The template includes a directory `locales` with a basic setup for english i18n. Enabling i18n
will pull the name and description for your extension from the english translation files instead
of the manifest.

Follow the instructions in the [official docs](https://developer.chrome.com/docs/extensions/reference/api/i18n#description) 
to add other translations and retrieve them in the extension.

If you don't need i18n you can ignore the `locales` directory until you need it, as it won't
be copied into the build folder unless the `localize` flag is set to `true`.

### Publish your extension to the CWS
To upload an extension to the Chrome store you have to pack (zip) it and then upload it to your item 
in the Chrome Web Store.

This repo includes a Github Action Workflow to create a 
[optimized prod build and the zip file](https://github.com/JohnBra/vite-web-extension/actions/workflows/ci.yml).

To run the workflow do the following:
1. Go to the **"Actions"** tab in your forked repository from this template
2. In the left sidebar click on **"Build and Zip Chrome Extension"**
3. Click on **"Run Workflow"** and select the main branch, then **"Run Workflow"**
4. Refresh the page and click the most recent run
5. In the summary page **"Artifacts"** section click on the generated **"vite-web-extension-chrome"**
6. Upload this file to the Chrome Web Store as described [here](https://developer.chrome.com/docs/webstore/publish/)

# Tech Docs 
- [Vite](https://vitejs.dev/)
- [Vite Plugins](https://vitejs.dev/guide/api-plugin.html)
- [Chrome Extension with manifest 3](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Extension i18n](https://developer.chrome.com/docs/extensions/reference/api/i18n#description)
- [Cross browser development with webextension-polyfill](https://github.com/mozilla/webextension-polyfill?tab=readme-ov-file#webextension-browser-api-polyfill)
- [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- [Rollup](https://rollupjs.org/guide/en/)
- [Tailwind CSS 4](https://tailwindcss.com/docs/configuration)

# Contributing 
Feel free to open PRs or raise issues!
