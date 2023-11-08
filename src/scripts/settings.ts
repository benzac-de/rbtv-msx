import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { STORAGE_PREFIX_ID } from "./tools";

const PRELOAD_PAGES_ID: string = "preload_pages";
const LONG_TITLES_ID: string = "long_titles";
const YOUTUBE_QUALITY_ID: string = "youtube_quality";

export class Settings {

    public readonly preloadPagesId: string = PRELOAD_PAGES_ID;
    public readonly longTitlesId: string = LONG_TITLES_ID;
    public readonly youtubeQualityId: string = YOUTUBE_QUALITY_ID;

    public preloadPages: boolean = true;
    public longTitles: boolean = true;
    public youtubeQuality: string = "default";

    public init(): void {
        this.preloadPages = tvx.Services.storage.getBool(STORAGE_PREFIX_ID + PRELOAD_PAGES_ID, this.preloadPages);
        this.longTitles = tvx.Services.storage.getBool(STORAGE_PREFIX_ID + LONG_TITLES_ID, this.longTitles);
        this.youtubeQuality = tvx.Services.storage.getFullStr(STORAGE_PREFIX_ID + YOUTUBE_QUALITY_ID, this.youtubeQuality);
    }

    public handleMessage(message: string): boolean {
        if (tvx.Tools.isFullStr(message)) {
            if (message.indexOf(PRELOAD_PAGES_ID + ":") == 0) {
                this.preloadPages = tvx.Tools.strToBool(message.substring(PRELOAD_PAGES_ID.length + 1), this.preloadPages);
                tvx.Services.storage.set(STORAGE_PREFIX_ID + PRELOAD_PAGES_ID, this.preloadPages);
                return true;
            } else if (message.indexOf(LONG_TITLES_ID + ":") == 0) {
                this.longTitles = tvx.Tools.strToBool(message.substring(LONG_TITLES_ID.length + 1), this.longTitles);
                tvx.Services.storage.set(STORAGE_PREFIX_ID + LONG_TITLES_ID, this.longTitles);
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