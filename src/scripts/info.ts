import * as tvx from "./lib/tvx-plugin-ux-module.min";

export class Info {
    public localContext: boolean = false;

    public init(data: tvx.MSXAttachedInfo): void {
        this.localContext = data != null && data.info != null && data.info.host === "local";
    }
}