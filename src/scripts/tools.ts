import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { Info } from "./info";
import { Settings } from "./settings";
import { polyfix } from "./parcel-polyfix";

polyfix();

const MSX_URL: string = tvx.Tools.getPrefixUrl("msx.benzac.de/?start={START}");
const PROXY_URL: string = tvx.Tools.getPrefixUrl("rbtv.msx.benzac.de/services/proxy.php?id={ID}");
const KEEP_RATIO_SUFFIX: string = "#msx-keep-ratio";
const INTERACTION_REF_SUFFIX: string = "@" + window.location.href;
const IMAGE_URLS: any = {
    //@ts-ignore
    "logo": new URL("../images/logo.png", import.meta.url).href,
    //@ts-ignore
    "background": new URL("../images/background.jpg", import.meta.url).href,
    //@ts-ignore
    "header": new URL("../images/header.jpg", import.meta.url).href,
    //@ts-ignore
    "shadow": new URL("../images/shadow.png", import.meta.url).href,
    //@ts-ignore
    "backdrop-mask": new URL("../images/backdrop-mask.png", import.meta.url).href,
    //@ts-ignore
    "placeholder": new URL("../images/placeholder.svg", import.meta.url).href
};

export const NAME: string = "RBTV MSX";
export const VERSION: string = "1.0.29";
export const MIN_APP_VERSION: string = "0.1.150";
export const STORAGE_PREFIX_ID: string = "rbtv:";
export const EVENT_SHOW_ID: string = "405";
export const DICTIONARY_URL: string = tvx.Tools.getPrefixUrl("msx.benzac.de/dic/de.json");
export const INFO: Info = new Info();
export const SETTINGS: Settings = new Settings();

export function getImageUrl(name: string): string {
    return tvx.Tools.isFullStr(name) ? IMAGE_URLS[name] : null;
}

export function appendKeepRatioSuffix(url: string): string {
    return tvx.Tools.isFullStr(url) ? url + KEEP_RATIO_SUFFIX : null;
}

export function appendInteractionRefSuffix(url: string): string {
    return tvx.Tools.isFullStr(url) ? url + INTERACTION_REF_SUFFIX : null;
}

export function callCallback(data?: any, callback?: (data?: any) => void): void {
    if (callback != null && typeof callback == "function") {
        callback(data != null ? data : null);
    }
}

export function objToBase64(obj: any): string {
    return tvx.Tools.base64EncodeUrl(tvx.Tools.serialize(obj));
}

export function base64ToObj(base64: string): any {
    return tvx.Tools.deserialize(tvx.Tools.base64DecodeUrl(base64));
}

export function checkVersion(data: tvx.MSXAttachedInfo): boolean {
    if (data != null && data.info != null && data.info.application != null) {
        return tvx.Tools.checkVersion(data.info.application.version, MIN_APP_VERSION);
    }
    return false;
}

export function proxyImage(url: string): string {
    if (tvx.Tools.isFullStr(url) && url.indexOf("//") == 0) {
        url = (tvx.Tools.isSecureContext() ? "https:" : "http:") + url;
    }
    return tvx.Tools.isHttpUrl(url) ? PROXY_URL.replace("{ID}", tvx.Tools.base64EncodeId(url)) : null;
}

export function proxyImageForLocalContext(url: string): string {
    //Note: Currently, some images from the RBTV backend cannot be served for an unknown origin (e.g. within a local context)
    //Therefore, we need to load them through a proxy (hopefully, this workaround is only needed temporarily)
    return INFO.localContext ? proxyImage(url) : url;
}

export function validatePlugin(): boolean {
    //Note: Check if the page was loaded within an iframe, otherwise do a redirect
    if (window.parent != null && window.location !== window.parent.location) {
        //Within an iframe
        return true;
    }
    //Outside an iframe
    window.location.replace(tvx.Tools.strReplace(MSX_URL, "{START}", tvx.Tools.strToUrlStr(appendInteractionRefSuffix("menu:request:interaction:init"))));
    return false;
}