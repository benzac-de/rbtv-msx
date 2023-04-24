# RBTV MSX
This is a **Rocket Beans TV (RBTV)** portal for the **Media Station X (MSX)** application that allows you to consume RBTV content on your Smart TV. It uses the [Rocket Beans TV API](https://github.com/rocketbeans/rbtv-apidoc) to browse and play RBTV content. You can simply set it up by installing MSX on your Smart TV (please see [Platform Support](https://msx.benzac.de/info/?tab=PlatformSupport) for corresponding application stores), launching it, and entering `rbtv.msx.benzac.de` as start parameter. You can also launch the portal directly in your browser by opening this link: [RBTV MSX](https://msx.benzac.de/?start=menu:request:interaction:init@https://rbtv.msx.benzac.de).

## Features
* Minimalistic, fast, and responsive UI (optimized for Smart TVs)
* Automatic list expansion (continuous scrolling)
* Extensive video information (related episodes, related show, involved people, etc.)
* Resume functions (show progress and resume content from last position)

## Screenshots
TODO

## Related Links
* Rocket Beans TV: https://rocketbeans.tv/
* Media Station X: https://msx.benzac.de/info/

## Possible Extensions
* User login/logout
* User related content

## For Developers
### Installing
```
npm install
```

### Testing on local dev server
```
npm run start
```
By default, the index page is available under: http://localhost:1234/index.html

#### Testing in browser
http://msx.benzac.de/?start=menu:request:interaction:init@http://localhost:1234/index.html

### Building for deployment
```
npm run clean-build
```

### Deploying on local server
```
npm install --global http-server
http-server ./dist --cors
```
By default, the index page is available under: http://localhost:8080/index.html

#### Testing in browser
http://msx.benzac.de/?start=menu:request:interaction:init@http://localhost:8080/index.html

#### Testing on TV device
* Copy folder `./src/msx` to `./dist/msx`
* Install and launch Media Station X application on TV device
* Navigate to Settings -> Start Parameter -> Setup
* Enter IP address and port of your local server (e.g. `192.168.0.10:8080`)
* Complete setup