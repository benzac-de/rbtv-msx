import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { STORAGE_PREFIX_ID } from "./tools";

const PRELOAD_PAGES_ID: string = "preload_pages";
const YOUTUBE_QUALITY_ID: string = "youtube_quality";

export class Settings {

    public preloadPages: boolean = true;

    public youtubeQuality: string = "default";

    public init(): void {
        this.preloadPages = tvx.Services.storage.getBool(STORAGE_PREFIX_ID + PRELOAD_PAGES_ID, this.preloadPages);
        this.youtubeQuality = tvx.Services.storage.getFullStr(STORAGE_PREFIX_ID + YOUTUBE_QUALITY_ID, this.youtubeQuality);
    }

    public handleMessage(message: string): boolean {
        if (tvx.Tools.isFullStr(message)) {
            if (message.indexOf(PRELOAD_PAGES_ID + ":") == 0) {
                this.preloadPages = tvx.Tools.strToBool(message.substring(PRELOAD_PAGES_ID.length + 1), this.preloadPages);
                tvx.Services.storage.set(STORAGE_PREFIX_ID + PRELOAD_PAGES_ID, this.preloadPages);
                return true;
            } else if (message.indexOf(YOUTUBE_QUALITY_ID + ":") == 0) {
                this.youtubeQuality = tvx.Tools.strFullCheck(message.substring(YOUTUBE_QUALITY_ID.length + 1), this.youtubeQuality);
                tvx.Services.storage.set(STORAGE_PREFIX_ID + YOUTUBE_QUALITY_ID, this.youtubeQuality);
                return true;
            }
        }
        return false;
    }
}