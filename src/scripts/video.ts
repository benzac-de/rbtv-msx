import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { objToBase64, callCallback } from "./tools";
import { loadEpisode } from "./backend";
import { expandHistory } from "./history";
import { getVideoTitle, getTokenType, getTokenUrl, getReleaseTimestamp, getThumbnail, getVideoDescription, createEpisodeAction, getTokenOptionsAction } from "./content-tools";
import { createVideoLoadError, createVideoPanel } from "./content-creator";

function handleVideoLoadError(videoId: string, data: any, callback: (data: any) => void): boolean {
    if (data != null && tvx.Tools.isFullStr(data.error)) {
        callCallback(createVideoLoadError(videoId, data.error), callback);
        return true;
    } else if (data != null && data.data == null) {
        callCallback(createVideoLoadError(videoId, "Missing data"), callback);
        return true;
    }
    return false;
}

function createVideo(videoId: string, data: any): any {
    if (data.data.episodes != null && data.data.episodes.length > 0) {
        let beans: any = data.data.bohnen;
        let episode: any = data.data.episodes[0];
        let url: string = getTokenUrl(episode);
        if (tvx.Tools.isFullStr(url)) {
            return {
                url: url,
                label: getVideoTitle(episode),
                properties: {
                    "rbtv:token": getTokenType(episode),
                    "rbtv:show": tvx.Tools.strFullCheck(episode.showName, null),
                    "rbtv:release": getReleaseTimestamp(episode),
                    "rbtv:duration": tvx.Tools.isNum(episode.duration) ? episode.duration : -1,
                    "resume:key": "url",
                    "control:type": "extended",
                    "info:size": "large",
                    "info:overlay": "full",
                    "info:image": getThumbnail(episode, "small"),
                    "info:text": getVideoDescription(episode, tvx.DateTools.getTimestamp()),
                    "trigger:start": "interaction:commit:message:video:" + episode.id,
                    "trigger:complete": episode.next != null ? "[player:button:next:execute|resume:position:none]" : "player:eject",
                    "trigger:back": "player:eject",
                    "button:content:icon": "info",
                    "button:content:action": "panel:json:" + objToBase64(createVideoPanel(beans, episode)),
                    "button:next:icon": "default",
                    "button:next:action": createEpisodeAction(episode.next, true),
                    "button:next:key": "channel_up",
                    "button:prev:icon": "default",
                    "button:prev:action": createEpisodeAction(episode.prev, true),
                    "button:prev:key": "channel_down",
                    "button:speed:icon": "settings",
                    "button:speed:action": getTokenOptionsAction(episode)
                }
            };
        }
        return createVideoLoadError(videoId, "Kein unterstütztes Token gefunden");
    }
    return createVideoLoadError(videoId, "Video nicht gefunden");
}

export function loadVideo(videoId: string, callback: (data: any) => void): void {
    loadEpisode(videoId, (data: any) => {
        if (!handleVideoLoadError(videoId, data, callback)) {
            callCallback(createVideo(videoId, data), callback);
        }
    });
}

export function executeVideo(videoId: string): void {
    if (tvx.Tools.isFullStr(videoId)) {
        tvx.InteractionPlugin.requestData("video:info", (data: tvx.MSXAttachedGeneric) => {
            if (data.video != null && data.video.info != null && tvx.Tools.isFullStr(data.video.info.label)) {
                expandHistory({
                    id: videoId,
                    title: data.video.info.label,
                    image: tvx.PropertyTools.getFullStr(data.video.info, "info:image", null),
                    token: tvx.PropertyTools.getFullStr(data.video.info, "rbtv:token", null),
                    show: tvx.PropertyTools.getFullStr(data.video.info, "rbtv:show", null),
                    release: tvx.PropertyTools.getNum(data.video.info, "rbtv:release", -1),
                    duration: tvx.PropertyTools.getNum(data.video.info, "rbtv:duration", -1),
                    timestamp: tvx.DateTools.getTimestamp()
                });
            }
        });
    } else {
        tvx.InteractionPlugin.warn("Empty video action");
    }
}