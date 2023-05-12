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

const DESCRIPTION_ELEMENT: any = document.createElement("div");

export const EXTENDED_SHOW_DESCRIPTION_LENGHT: number = 380;
export const MAX_SEASON_NAME_LENGHT: number = 40;
export const MIN_SEARCH_EXPRESSION_LENGHT: number = 2;
export const MAX_SEARCH_EXPRESSION_LENGHT: number = 40;

function getPlayerOptionsAction(): string {
    return "[release:panel|panel:request:player:options]";
}

function getToken(item: any, type: string): string {
    if (item != null && item.tokens != null && item.tokens.length > 0) {
        for (let i: number = 0; i < item.tokens.length; i++) {
            if (item.tokens[i].type === type) {
                return item.tokens[i].token;
            }
        }
    }
    return null;
}

function tryApplyToken(item: any, type: string): boolean {
    if (item != null) {
        let token: string = getToken(item, type);
        if (tvx.Tools.isFullStr(token)) {
            item.msxTokenType = type;
            item.msxTokenId = token;
            return true;
        }
    }
    return false;
}

function applyToken(item: any): void {
    if (item != null && item.msxTokenType == null) {
        if (!tryApplyToken(item, "youtube") &&
            !tryApplyToken(item, "twitch") &&
            !tryApplyToken(item, "soundcloud")) {
            item.msxTokenType = "none";
            item.msxTokenId = null;
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

export function getPotrait(item: any, name: string): string {
    return getAnyImage(item, item != null ? item.portraitImage : null, "msxPotrait", name);
}

export function getTokenType(item: any): string {
    if (item != null) {
        applyToken(item);
        return item.msxTokenType;
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
        } else if (item.msxTokenType == "none") {
            //Note: Return YouTube color, because this is the most used one
            return YOUTUBE_COLOR;
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
            return "plugin:" + YOUTUBE_PLUGIN.replace("{ID}", item.msxTokenId).replace("{QUALITY}", SETTINGS.youtubeQuality);
        } else if (item.msxTokenType == "twitch") {
            return "plugin:" + TWITCH_PLUGIN.replace("{ID}", item.msxTokenId);
        } else if (item.msxTokenType == "soundcloud") {
            return "plugin:" + SOUNDCLOUD_PLUGIN.replace("{ID}", item.msxTokenId);
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
    if (item != null && tvx.Tools.isNum(item.duration) && item.duration >= 0) {
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

export function getBeanRole(item: any, shorthand: boolean): string {
    if (item != null) {
        if (item.role === "onair") {
            return shorthand ? "Host" : "Host/Moderator bei RBTV";
        } else if (item.role === "offair") {
            return shorthand ? "Crew" : "Crew-Mitglied bei RBTV";
        } else if (item.role === "external") {
            return shorthand ? "Partner" : "Partner/Freund von RBTV";
        }
    }
    return shorthand ? null : "Unbekannte Rolle bei RBTV";
}

export function getBeanVideosCount(item: any): string {
    return item != null ? addTextPrefix("{ico:video-collection}", item.episodeCount > 0 ? "" + item.episodeCount : null, " ") : null;
}

export function getVideoTitle(item: any): string {
    return tvx.Tools.strFullCheck(item != null ? item.title : null, "Unbekanntes Video");
}

export function getReleaseTimestamp(item: any): number {
    if (item != null) {
        if (item.msxRelease == null) {
            //Note: Also handle typo property "distibutionPublishingDate"
            if (item.distributionPublishingDate != null) {
                item.msxRelease = strToTimestamp(item.distributionPublishingDate);
            } else if (item.distibutionPublishingDate != null) {
                item.msxRelease = strToTimestamp(item.distibutionPublishingDate);
            } else if (item.firstBroadcastdate != null) {
                item.msxRelease = strToTimestamp(item.firstBroadcastdate);
            }
        }
        return item.msxRelease != null ? item.msxRelease : -1;
    }
    return -1;
}

export function getReleaseDuration(item: any, timestamp: number): string {
    if (item != null) {
        let releaseTimestamp: number = getReleaseTimestamp(item);
        if (releaseTimestamp > 0) {
            let duration: number = (timestamp - releaseTimestamp) / 1000;
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
    return "" + (index + 1);
}

export function getVideosCount(total: number): string {
    return total == 0 ? "Keine Videos" : (total == 1 ? "Ein Video" : total + " Videos");
}

export function getEpisodesCount(total: number): string {
    return total == 0 ? "Keine Folgen" : (total == 1 ? "Eine Folge" : total + " Folgen");
}

export function getShowsCount(total: number): string {
    return total == 0 ? "Keine Shows" : (total == 1 ? "Eine Show" : total + " Shows");
}

export function getBeansCount(total: number): string {
    return total == 0 ? "Keine Bohnen" : (total == 1 ? "Eine Bohne" : total + " Bohnen");
}

export function getSeasonsCount(total: number): string {
    return total == 0 ? "Keine Staffeln" : (total == 1 ? "Eine Staffel" : total + " Staffeln");
}

export function getSearchCount(totalShows: number, totalEpisodes: number): string {
    return getShowsCount(totalShows) + " und " + (totalEpisodes == 0 ? "keine Videos" : (totalEpisodes == 1 ? "ein Video" : totalEpisodes + " Videos")) + " gefunden"
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

export function getEpisodesOrderLabel(order: string, showRelated: boolean): string {
    if (order == "default") {
        return "Neuste " + (showRelated ? "Folgen" : "Videos") + " zuerst";
    } else if (order == "reverse") {
        return "Älteste " + (showRelated ? "Folgen" : "Videos") + " zuerst";
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

export function createVideoAction(videoId: string, autoMode: boolean): string {
    return "video:" + (autoMode ? "auto:" : "") + "resolve:" + createVideoRequest(videoId);
}

export function createEpisodeAction(item: any, autoMode: boolean): string {
    return item != null && tvx.Tools.isNum(item.id) ? createVideoAction(item.id, autoMode) : null;
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

export function createPlaceholderUrl(): string {
    return getImageUrl("placeholder");
}

export function getPinTag(pinned: boolean): string {
    return pinned ? "{ico:msx-black:star}" : null;
}

export function getPinIcon(pinned: boolean): string {
    return pinned ? "star" : "star-border";
}

export function getPinHint(context: string, pinned: boolean): string {
    return context + (pinned ? " entfernen" : " hinzufügen");
}

export function createEpisodesFromHistory(history: any): any {
    let episodes: any = [];
    if (history != null && history.length > 0) {
        for (let i: number = 0; i < history.length; i++) {
            let item: any = history[i];
            episodes.push({
                id: item.id,
                title: item.title,
                duration: item.duration,
                showName: item.show,
                msxTokenType: item.token,
                msxThumbnail: item.image,
                msxRelease: item.release
            });
        }
    }
    return episodes;
}

export function createDescriptionFromHTML(html: string): string {
    let description: string = null;
    if (tvx.Tools.isFullStr(html)) {
        DESCRIPTION_ELEMENT.innerHTML = html
            .replace(/<p>/g, "")
            .replace(/<\/p>/g, "{br}")
            .replace(/<strong>/g, "{col:msx-white}")
            .replace(/<\/strong>/g, "{col}");
        description = tvx.Tools.strTrim(DESCRIPTION_ELEMENT.textContent);
        DESCRIPTION_ELEMENT.innerHTML = "";
    }
    return tvx.Tools.strFullCheck(description, "Keine Beschreibung vorhanden.");
}