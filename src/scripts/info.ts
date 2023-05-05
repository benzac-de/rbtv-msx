import * as tvx from "./lib/tvx-plugin-ux-module.min";

export class Info {
    public localContext: boolean = false;

    public init(data: tvx.MSXAttachedInfo): void {
        //Note: The host "52357benzac.de.mediastationx" is used in local UWP instances
        this.localContext = data != null && data.info != null && (data.info.host === "local" || data.info.host === "52357benzac.de.mediastationx");
    }
}