import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { callCallback } from "./tools";

const CACHE_EXPIRATION: number = 3600000;//1 hour

const cache: any = {};

let requestCounter: number = 0;

function compareBeanIndex(bean1: any, bean2: any): number {
    return bean1.msxIndex - bean2.msxIndex;
}

function compareBeanName(bean1: any, bean2: any): number {
    if (bean1.msxName == bean2.msxName) {
        return 0;
    } else if (bean1.msxName == null && bean2.msxName != null) {
        return 1;
    } else if (bean1.msxName != null && bean2.msxName == null) {
        return -1;
    }
    return bean1.msxName.localeCompare(bean2.msxName);
}

function compareBeanEpisodes(bean1: any, bean2: any): number {
    if (bean1.msxEpisodes == bean2.msxEpisodes) {
        return 0;
    } else if (bean1.msxEpisodes == -1 && bean2.msxEpisodes != -1) {
        return 1;
    } else if (bean1.msxEpisodes != -1 && bean2.msxEpisodes == -1) {
        return -1;
    }
    return bean2.msxEpisodes - bean1.msxEpisodes;
}

function preloadData(data: any): void {
    if (data != null && data.length > 0) {
        for (let i: number = 0; i < data.length; i++) {
            data[i].preload = true;
            data[i].preloadOffset = data.length - 1 - i;
        }
    }
}

function concatData(originData: any, moreData: any): any {
    if (originData != null && originData.length > 0) {
        if (moreData != null && moreData.length > 0) {
            preloadData(originData);
            return originData.concat(moreData);
        }
        return originData;
    }
    return moreData;
}

function mergeData(originData: any, moreData: any): any {
    if (originData != null) {
        if (moreData != null) {
            for (let id in moreData) {
                if (originData[id] == null) {
                    originData[id] = moreData[id];
                }
            }
        }
        return originData;
    }
    return moreData;
}

function createParameter(name: string, value: string | number): string {
    if (tvx.Tools.isFullStr(name) && (tvx.Tools.isFullStr(value) || tvx.Tools.isNum(value))) {
        return encodeURIComponent(name) + "=" + (tvx.Tools.isNum(value) ? value : encodeURIComponent(value));
    }
    return null;
}

function validateCache() {
    let timestamp: number = tvx.DateTools.getTimestamp();
    for (let id in cache) {
        if (timestamp - cache[id].timestamp > CACHE_EXPIRATION) {
            delete cache[id];
        }
    }
}

export function storeData(id: string, data: any): void {
    if (tvx.Tools.isFullStr(id) && data != null) {
        cache[id] = {
            data: data,
            timestamp: tvx.DateTools.getTimestamp()
        };
    }
}

export function restoreData(id: string): any {
    if (tvx.Tools.isFullStr(id)) {
        validateCache();
        return cache[id] != null ? cache[id].data : null;
    }
    return null;
}

export function appendParameter(query: string, name: string, value: string | number): string {
    let parameter = createParameter(name, value);
    if (tvx.Tools.isFullStr(parameter)) {
        return tvx.Tools.isFullStr(query) ? query + "&" + parameter : parameter;
    }
    return query;
}

export function appendQuery(path: string, query: string): string {
    return tvx.Tools.strFullCheck(path, "") + (tvx.Tools.isFullStr(query) ? "?" + query : "");
}

export function checkId(id: string, callback?: (data: any) => void): boolean {
    if (tvx.Tools.isFullStr(id)) {
        return true;
    } else {
        callCallback({
            error: "Backend error: Missing ID"
        }, callback);
    }
    return false;
}

export function createIdPath(path: string, id: string): string {
    return tvx.Tools.strReplace(path, "{ID}", id);
}

export function createExpressionPath(path: string, expression: string): string {
    return tvx.Tools.strReplace(path, "{EXPRESSION}", tvx.Tools.strToUrlStr(expression));
}

export function isListLoaded(list: any): boolean {
    return list != null && list.pagination != null && list.pagination.total >= 0;
}

export function canExtendList(list: any): boolean {
    return list != null && list.pagination != null && list.pagination.offset + list.pagination.limit < list.pagination.total;
}

export function shoudlLoadList(list: any, extend?: boolean): boolean {
    return (extend !== true && !isListLoaded(list)) || (extend === true && canExtendList(list));
}

export function startLoadList(list: any): number {
    if (list != null) {
        requestCounter++;
        list.counter = requestCounter;
        return requestCounter;
    }
    return 0;
}

export function stopLoadList(list: any, counter: number): boolean {
    return list != null && list.counter == counter;
}

export function getListOffset(list: any): number {
    return list != null && list.pagination != null ? list.pagination.offset + (list.pagination.total >= 0 ? list.pagination.limit : 0) : 0;
}

export function getListLimit(list: any): number {
    return list != null && list.pagination != null ? list.pagination.limit : 0;
}

export function validateList(list: any, type: string, id: string, order: string, filter: string): any {
    let timestamp: number = tvx.DateTools.getTimestamp();
    if (list == null ||
        list.type !== type ||
        list.id !== id ||
        list.order !== order ||
        list.filter !== filter ||
        timestamp - list.timestamp > CACHE_EXPIRATION) {
        list = {
            type: type,
            id: id,
            order: order,
            filter: filter,
            pagination: {
                offset: 0,
                limit: 24,
                total: -1
            },
            data: null,
            extendable: false,
            timestamp: timestamp
        };
    }
    return list;
}

export function extendList(list: any, data: any): void {
    if (list != null && data != null && data.pagination != null) {
        list.pagination = data.pagination;
        list.extendable = canExtendList(list);
        if (data.data != null && data.data.episodes != null) {
            //Episodes request
            list.data = concatData(list.data, data.data.episodes);
            list.bohnen = mergeData(list.bohnen, data.data.bohnen);
        } else {
            //Shows request
            list.data = concatData(list.data, data.data);
        }
    }
}

export function validateSearch(results: any, expression: string): any {
    let timestamp: number = tvx.DateTools.getTimestamp();
    if (results == null ||
        results.expression !== expression ||
        timestamp - results.timestamp > CACHE_EXPIRATION) {
        results = {
            expression: expression,
            data: null,
            timestamp: timestamp
        };
    }
    return results;
}

export function sortBeans(data: any, order?: string): void {
    if (data != null && data.data != null && data.data.length > 1 && tvx.Tools.isFullStr(order)) {
        let beans: any = data.data;
        if (beans.msxOrder == null) {
            for (let i: number = 0; i < beans.length; i++) {
                let bean: any = beans[i];
                bean.msxIndex = i;
                bean.msxName = tvx.Tools.strFullCheck(bean.name, null);
                bean.msxEpisodes = tvx.Tools.strToNum(bean.episodeCount, -1);
            }
        }
        beans.msxOrder = order;
        beans.sort((bean1: any, bean2: any): number => {
            if (order == "default") {
                return compareBeanIndex(bean1, bean2);
            } else if (order == "name") {
                return compareBeanName(bean1, bean2);
            } else if (order == "episodes") {
                return compareBeanEpisodes(bean1, bean2);
            }
            return 0;
        });
    }
}