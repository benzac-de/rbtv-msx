import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { callCallback } from "./tools";

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
        }
    }
}

function concatData(originData: any, moreData: any, extendable: boolean): any {
    if (originData != null && originData.length > 0) {
        if (moreData != null && moreData.length > 0) {
            preloadData(originData);
            if (!extendable) {
                preloadData(moreData);
            }
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
        list.requestHash = list.hash;
        return list.hash;
    }
    return 0;
}

export function stopLoadList(list: any, requestHash: number): boolean {
    return list != null && list.requestHash == requestHash;
}

export function getListOffset(list: any): number {
    return list != null && list.pagination != null ? list.pagination.offset + (list.pagination.total >= 0 ? list.pagination.limit : 0) : 0;
}

export function getListLimit(list: any): number {
    return list != null && list.pagination != null ? list.pagination.limit : 0;
}

export function validateList(list: any, type: string, id: string, order: string, filter: string): any {
    if (list == null || list.type !== type || list.id !== id || list.order !== order || list.filter !== filter) {
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
            counter: 0,
            hash: 0
        };
    } else {
        list.counter++;
    }
    list.hash = tvx.Tools.createHash(
        tvx.Tools.strFullCheck(list.type, "") + "_" +
        tvx.Tools.strFullCheck(list.id, "") + "_" +
        tvx.Tools.strFullCheck(list.order, "") + "_" +
        tvx.Tools.strFullCheck(list.filter, "") + "_" +
        list.pagination.offset + "_" +
        list.counter);
    return list;
}

export function extendList(list: any, data: any): void {
    if (list != null && data != null && data.pagination != null) {
        list.pagination = data.pagination;
        list.extendable = canExtendList(list);
        if (data.data != null && data.data.episodes != null) {
            //Episodes request
            list.data = concatData(list.data, data.data.episodes, list.extendable);
            list.bohnen = mergeData(list.bohnen, data.data.bohnen);
        } else {
            //Shows request
            list.data = concatData(list.data, data.data, list.extendable);
        }
    }
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