import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { SETTINGS, appendInteractionRefSuffix, appendKeepRatioSuffix, getImageUrl } from "./tools";

const YOUTUBE_COLOR: string = "#ff0000";
const TWITCH_COLOR: string = "#643fa6";
const SOUNDCLOUD_COLOR: string = "#ff5500";

const YOUTUBE_PLUGIN: string = "http://msx.benzac.de/plugins/youtube.html?id={ID}&quality={QUALITY}";
const TWITCH_PLUGIN: string = "http://msx.benzac.de/plugins/twitch.html?id={ID}";
const SOUNDCLOUD_PLUGIN: string = "http://msx.benzac.de/plugins/soundcloud.html?id={ID}";

const YOUTUBE_PREFIX_1: string = "https://youtu.be/";
const YOUTUBE_PREFIX_2: string = "https://www.youtube.com/watch?v=";

export const EXTENDED_SHOW_DESCRIPTION_LENGHT: number = 380;
export const MAX_SEASON_NAME_LENGHT: number = 45;

function getPlayerOptionsAction(): string {
    return "[release:panel|panel:request:player:options]";
}

function tryApplyToken(item: any, type: string): boolean {
    if (item != null) {
        let token: string = getToken(item, type);
        if (tvx.Tools.isFullStr(token)) {
            item.msxToken = token;
            item.msxTokenType = type;
            return true;
        }
    }
    return false;
}

function applyToken(item: any): void {
    if (item != null && item.msxToken == null) {
        if (!tryApplyToken(item, "youtube") &&
            !tryApplyToken(item, "twitch") &&
            !tryApplyToken(item, "soundcloud")) {
            item.msxToken = "none";
            item.msxTokenType = "none";
        }
    }
}

function getAnyImage(item: any, images: any, type: string, name: string): string {
    if (item != null) {
        if (item[type] == null && images != null && images.length > 0) {
            for (let i: number = 0; i < images.length; i++) {
                let imageItem: any = images[i];
                if (tvx.Tools.isFullStr(imageItem.url)) {
                    item[type] = imageItem.url;
                    if (imageItem.name === name) {
                        break;
                    }
                }
            }
        }
        return item[type];
    }
    return null;
}

export function addTextPrefix(prefix: string, text: string, separator?: string): string {
    if (tvx.Tools.isFullStr(prefix) && tvx.Tools.isFullStr(text)) {
        if (separator != null) {
            return prefix + separator + text;
        } else {
            return prefix + text;
        }
    }
    return text;
}

export function appendTextSegment(text: string, segment: string, separator?: string): string {
    if (tvx.Tools.isFullStr(segment)) {
        if (separator != null) {
            return tvx.Tools.isFullStr(text) ? text + separator + segment : segment;
        } else {
            return tvx.Tools.isFullStr(text) ? text + segment : segment;
        }
    }
    return text;
}

export function appendTextTab(text: string, tab: string): string {
    return appendTextSegment(text, tab, "{tb}");
}

export function appendTextLine(text: string, line: string): string {
    return appendTextSegment(text, line, "{br}");
}

export function strToTimestamp(str: string): number {
    if (tvx.Tools.isFullStr(str)) {
        let timestamp: number = new Date(str).getTime();
        if (isFinite(timestamp)) {
            return timestamp;
        }
    }
    return -1;
}

export function getShowreelId(item: any): string {
    if (item != null && tvx.Tools.isFullStr(item.showreelURL)) {
        if (item.showreelURL.indexOf(YOUTUBE_PREFIX_1) == 0) {
            return item.showreelURL.substring(YOUTUBE_PREFIX_1.length);
        } else if (item.showreelURL.indexOf(YOUTUBE_PREFIX_2) == 0) {
            return item.showreelURL.substring(YOUTUBE_PREFIX_2.length);
        }
    }
    return null;
}

export function getShowreelAction(item: any): string {
    let showreelId: string = getShowreelId(item);
    return tvx.Tools.isFullStr(showreelId) ? "video:plugin:" + YOUTUBE_PLUGIN.replace("{ID}", showreelId).replace("{QUALITY}", SETTINGS.youtubeQuality) : null;
}

export function getShowreelOptionsAction(): string {
    return getPlayerOptionsAction();
}

export function getThumbnail(item: any, name: string): string {
    return getAnyImage(item, item != null ? item.thumbnail : null, "msxThumbnail", name);
}

export function getImage(item: any, name: string): string {
    return getAnyImage(item, item != null ? item.images : null, "msxImage", name);
}

export function getPotraitImage(item: any, name: string): string {
    return getAnyImage(item, item != null ? item.portraitImage : null, "msxtPotraitImage", name);
}

export function getToken(item: any, type: string): string {
    if (item != null && item.tokens != null && item.tokens.length > 0) {
        for (let i: number = 0; i < item.tokens.length; i++) {
            if (item.tokens[i].type === type) {
                return item.tokens[i].token;
            }
        }
    }
    return null;
}

export function getTokenColor(item: any): string {
    if (item != null) {
        applyToken(item);
        if (item.msxTokenType == "youtube") {
            return YOUTUBE_COLOR;
        } else if (item.msxTokenType == "twitch") {
            return TWITCH_COLOR;
        } else if (item.msxTokenType == "soundcloud") {
            return SOUNDCLOUD_COLOR;
        }
    }
    return null;
}

export function getTokenPrefix(item: any): string {
    if (item != null) {
        applyToken(item);
        if (item.msxTokenType == "youtube") {
            return "{ico:" + YOUTUBE_COLOR + ":smart-display}";
        } else if (item.msxTokenType == "twitch") {
            return "{ico:" + TWITCH_COLOR + ":videogame-asset}";
        } else if (item.msxTokenType == "soundcloud") {
            return "{ico:" + SOUNDCLOUD_COLOR + ":mic}";
        } else if (item.msxTokenType == "none") {
            return "{ico:msx-yellow:warning}";
        }
    }
    return null;
}

export function getTokenUrl(item: any): string {
    if (item != null) {
        applyToken(item);
        if (item.msxTokenType == "youtube") {
            return "plugin:" + YOUTUBE_PLUGIN.replace("{ID}", item.msxToken).replace("{QUALITY}", SETTINGS.youtubeQuality);
        } else if (item.msxTokenType == "twitch") {
            return "plugin:" + TWITCH_PLUGIN.replace("{ID}", item.msxToken);
        } else if (item.msxTokenType == "soundcloud") {
            return "plugin:" + SOUNDCLOUD_PLUGIN.replace("{ID}", item.msxToken);
        }
    }
    return null;
}

export function getTokenOptionsAction(item: any): string {
    if (item != null) {
        applyToken(item);
        if (item.msxTokenType == "youtube" || item.msxTokenType == "twitch") {
            return getPlayerOptionsAction();
        }
    }
    return null;
}

export function getDuration(item: any): string {
    if (item != null && tvx.Tools.isNum(item.duration)) {
        return addTextPrefix(getTokenPrefix(item), "{num:" + (item.duration * 1000) + ":duration:time:hh:mm:ss}", " ");
    }
    return null;
}

export function getLiveDuration(item: any): string {
    if (item != null) {
        return addTextPrefix(getTokenPrefix(item), "-{countdown:time:hh:mm:ss}", " ");
    }
    return null;
}

export function getShowTitle(item: any): string {
    return tvx.Tools.strFullCheck(item != null ? item.title : null, "Unbekannte Show");
}

export function getPodcastHint(item: any): string {
    if (item != null) {
        if (item.isTruePodcast === true) {
            return "{ico:rss-feed}";
        }
        return item.hasPodcast === true || (item.podcast != null && tvx.Tools.isFullStr(item.podcast.soundcloudId)) ? "{ico:mic}" : null;
    }
    return null;
}

export function getShowBackground(item: any, name: string): string {
    if (item != null) {
        getAnyImage(item, item.backgroundImage, "msxBackground", name);
        if (item.msxBackground == null && item.slideshowImages != null && item.slideshowImages.length > 0) {
            for (let i: number = 0; i < item.slideshowImages.length; i++) {
                let slideshowItem: any = item.slideshowImages[i];
                if (slideshowItem.length > 0) {
                    for (let si: number = 0; si < slideshowItem.length; si++) {
                        let subSlideshowItem: any = slideshowItem[si];
                        if (tvx.Tools.isFullStr(subSlideshowItem.url)) {
                            item.msxBackground = subSlideshowItem.url;
                            if (subSlideshowItem.name === name) {
                                i = item.slideshowImages.length;
                                break;
                            }
                        }
                    }
                }
            }
        }
        return item.msxBackground;
    }
    return null;
}

export function getBeanName(item: any): string {
    return tvx.Tools.strFullCheck(item != null ? item.name : null, "Unbekannte Person");
}

export function getBeanFullName(item: any): string {
    return tvx.Tools.strFullCheck(item != null ? item.computedName : null, "Unbekannte Person");
}

export function getVideoTitle(item: any): string {
    return tvx.Tools.strFullCheck(item != null ? item.title : null, "Unbekanntes Video");
}

export function getReleaseDuration(item: any, timestamp: number): string {
    if (item != null) {
        if (item.msxRealeaseTimestamp == null) {
            if (item.distributionPublishingDate != null) {
                item.msxRealeaseTimestamp = strToTimestamp(item.distributionPublishingDate);
            } else if (item.firstBroadcastdate != null) {
                item.msxRealeaseTimestamp = strToTimestamp(item.firstBroadcastdate);
            }
        }
        if (item.msxRealeaseTimestamp != null && item.msxRealeaseTimestamp > 0) {
            let duration: number = (timestamp - item.msxRealeaseTimestamp) / 1000;
            let years: number = Math.floor(duration / 31536000);
            if (years > 0) {
                return "vor " + (years == 1 ? "einem Jahr" : years + " Jahren");
            } else {
                let months: number = Math.floor(duration / 2628000);
                if (months > 0) {
                    return "vor " + (months == 1 ? "einem Monat" : months + " Monaten");
                } else {
                    let days: number = Math.floor(duration / 86400);
                    if (days > 0) {
                        return "vor " + (days == 1 ? "einem Tag" : days + " Tagen");
                    } else {
                        let hours: number = Math.floor(duration / 3600);
                        if (hours > 0) {
                            return "vor " + (hours == 1 ? "einer Stunde" : hours + " Stunden");
                        } else {
                            let minutes: number = Math.floor(duration / 60);
                            return "vor " + (minutes <= 1 ? "einer Minute" : minutes + " Minuten");
                        }
                    }
                }
            }
        }
    }
    return null;
}

export function getTotalItems(data: any, pagination: any): any {
    return pagination != null ? pagination.total : (data != null ? data.length : -1);
}

export function getListNumber(index: number): string {
    return tvx.Tools.strValue(index + 1);
}

export function getEpisodesCount(total: number): string {
    return total == 1 ? "Eine Folge" : total + " Folgen";
}

export function getShowsCount(total: number): string {
    return total == 1 ? "Eine Show" : total + " Shows";
}

export function getBeansCount(total: number): string {
    return total == 1 ? "Eine Bohne" : total + " Bohnen";
}

export function getSeasonsCount(total: number): string {
    return total == 1 ? "Eine Staffel" : total + " Staffeln";
}

export function getEpisodeFooter(item: any, timestamp: number): string {
    let footer: string = null;
    if (item != null) {
        footer = appendTextLine(footer, addTextPrefix("{ico:local-movies}", item.showName, " "));
        footer = appendTextLine(footer, addTextPrefix("{ico:event}", getReleaseDuration(item, timestamp), " "));
    }
    return footer;
}

export function getVideoDescription(item: any, timestamp: number): string {
    let description: string = null;
    if (item != null) {
        description = appendTextTab(description, addTextPrefix("{col:msx-white}{ico:local-movies}", item.showName, " "));
        description = appendTextTab(description, addTextPrefix("{col:msx-white}{ico:event}", getReleaseDuration(item, timestamp), " "));
        description = appendTextLine(description, addTextPrefix("{col}", item.description));
    }
    return description;
}

export function getEpisodesSeasonLabel(item: any, withCount: boolean) {
    if (item != null) {
        let suffix: string = withCount ? " {txt:msx-white-soft:(" + getEpisodesCount(item.numEpisodes) + ")}" : "";
        if (tvx.Tools.isFullStr(item.name)) {
            return tvx.Tools.strTruncate(item.name, MAX_SEASON_NAME_LENGHT) + suffix;
        } else if (tvx.Tools.isNum(item.numeric)) {
            return "Staffel " + item.numeric + suffix;
        }
        return "Unbekannte Staffel" + suffix;
    }
    return "Alle Folgen";
}

export function getShowFooter(item: any): string {
    if (item != null) {
        let podcastHint: string = getPodcastHint(item);
        return addTextPrefix(podcastHint, tvx.Tools.strFullCheck(item.genre, tvx.Tools.isFullStr(podcastHint) ? "Podcast" : null), " ");
    }
    return null;
}

export function getShowDescription(item: any): string {
    return item != null ? item.description : null;
}

export function getShowsOrderParameter(order: string): string {
    if (order == "default") {
        return "LastEpisode";
    } else if (order == "title") {
        return "Title";
    }
    return null;
}

export function getShowsOrderLabel(order: string): string {
    if (order == "default") {
        return "Letzte Akualisierung";
    } else if (order == "title") {
        return "Titel (alphabetisch)";
    }
    return "Unbekannt (" + order + ")";
}

export function getShowsFilterParameter(filter: string): string {
    return filter == "podcast" ? "podcast" : null;
}

export function getShowsFilterLabel(filter: string): string {
    if (filter == "default") {
        return "Alle";
    } else if (filter == "podcast") {
        return "Podcasts";
    }
    return "Unbekannt (" + filter + ")";
}

export function getEpisodesOrderParameter(order: string): string {
    return order == "reverse" ? "ASC" : "DESC";
}

export function getBeansOrderLabel(order: string): string {
    if (order == "default") {
        return "Standard";
    } else if (order == "name") {
        return "Name (alphabetisch)";
    } else if (order == "episodes") {
        return "Videoanzahl";
    }
    return "Unbekannt (" + order + ")";
}

export function getEpisodesOrderLabel(order: string): string {
    if (order == "default") {
        return "Neuste Folgen zuerst";
    } else if (order == "reverse") {
        return "Älteste Folgen zuerst";
    }
    return "Unbekannt (" + order + ")";
}

export function getYouTubeQualityLabel(quality: string): string {
    return quality == "default" ? "Auto" : quality;
}

export function createContentRequest(contentId: string): string {
    return appendInteractionRefSuffix("request:interaction:content:" + contentId);
}

export function createVideoRequest(videoId: string): string {
    return appendInteractionRefSuffix("request:interaction:video:" + videoId);
}

export function createLogoUrl(): string {
    return getImageUrl("logo");
}

export function createHeaderUrl(): string {
    return getImageUrl("header");
}

export function createShadowUrl(): string {
    return getImageUrl("shadow");
}

export function createBackgroundUrl(): string {
    return appendKeepRatioSuffix(getImageUrl("background"));
}