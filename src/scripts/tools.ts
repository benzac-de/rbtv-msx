import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { polyfix } from "./parcel-polyfix";

polyfix();

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
    "backdrop-mask": new URL("../images/backdrop-mask.png", import.meta.url).href
};

export const NAME: string = "RBTV MSX";
export const VERSION: string = "1.0.3";
export const MIN_APP_VERSION: string = "0.1.150";
export const EVENT_SHOW_ID: string = "405";

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

export function checkVersion(data: tvx.MSXAttachedInfo): boolean {
    if (data != null && data.info != null && data.info.application != null) {
        return tvx.Tools.checkVersion(data.info.application.version, MIN_APP_VERSION);
    }
    return false;
}