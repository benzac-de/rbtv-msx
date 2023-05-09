import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { STORAGE_PREFIX_ID, callCallback, objToBase64, base64ToObj } from "./tools";
import { loadShow, loadBean } from "./backend";

const PINNED_SHOWS_ID: string = "pinned_shows";
const PINNED_BEANS_ID: string = "pinned_beans";

let pinnedShowsList: any = null;
let pinnedShowsMap: any = null;
let pinnedBeansList: any = null;
let pinnedBeansMap: any = null;

function validateList(list: any): any {
    return list != null ? list : [];
}

function validateId(id: string | number): string {
    return tvx.Tools.isNum(id) ? "" + id : tvx.Tools.strFullCheck(id, null);
}

function createMap(list: any): any {
    if (list != null) {
        let map: any = {};
        for (let i: number = 0; i < list.length; i++) {
            let pin: any = list[i];
            map[pin.id] = pin;
        }
        return map;
    }
    return null;
}

function validateMap(map: any, list: any): any {
    return map != null ? map : createMap(list);
}

function getPin(map: any, list: any, id: string): any {
    if (tvx.Tools.isFullStr(id)) {
        if (map != null) {
            return map[id];
        }
        if (list != null && list.length > 0) {
            for (let i: number = 0; i < list.length; i++) {
                let pin: any = list[i];
                if (pin.id == id) {
                    return pin;
                }
            }
        }
    }
    return null;
}

function movePin(list: any, id: string, direction: string): any {
    if (list != null && list.length > 1 && tvx.Tools.isFullStr(id)) {
        let index: number = -1;
        for (let i: number = 0; i < list.length; i++) {
            if (list[i].id == id) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            let newIndex: number = -1;
            if (direction === "up") {
                newIndex = index - 1;
            } else if (direction === "down") {
                newIndex = index + 1;
            } else if (direction === "start") {
                newIndex = 0;
            } else if (direction === "end") {
                newIndex = list.length - 1;
            }
            if (newIndex != index && newIndex >= 0 && newIndex < list.length) {
                let pin: any = list[index];
                list.splice(index, 1);
                list.splice(newIndex, 0, pin);
                return pin;
            }
        }
    }
    return null;
}

function removePin(list: any, id: string): any {
    if (list != null && list.length > 0 && tvx.Tools.isFullStr(id)) {
        for (let i: number = 0; i < list.length; i++) {
            let pin: any = list[i];
            if (pin.id == id) {
                list.splice(i, 1);
                return pin;
            }
        }
    }
    return null;
}

function addPin(list: any, pin: any): any {
    if (list != null && pin != null) {
        list.push(pin);
    }
    return pin;
}

function storePins(listId: string, list: any, pin: any): any {
    if (list != null && pin != null) {
        if (list.length == 0) {
            tvx.Services.storage.remove(STORAGE_PREFIX_ID + listId);
        } else {
            tvx.Services.storage.set(STORAGE_PREFIX_ID + listId, objToBase64(list));
        }
    }
    return pin;
}

function restorePins(listId: string): any {
    return base64ToObj(tvx.Services.storage.getFullStr(STORAGE_PREFIX_ID + listId, null));
}

export function initPins(): any {
    pinnedShowsList = validateList(restorePins(PINNED_SHOWS_ID));
    pinnedBeansList = validateList(restorePins(PINNED_BEANS_ID));
}

export function getPinnedShows(): any {
    return validateList(pinnedShowsList);
}

export function getPinnedShow(id: string | number): any {
    pinnedShowsMap = validateMap(pinnedShowsMap, pinnedShowsList);
    return getPin(pinnedShowsMap, pinnedShowsList, validateId(id));
}

export function isShowPinned(id: string | number): boolean {
    return getPinnedShow(id) != null;
}

export function movePinnedShow(id: string | number, direction: string): any {
    return storePins(PINNED_SHOWS_ID, pinnedShowsList, movePin(pinnedShowsList, validateId(id), direction));
}

export function pinShow(id: string | number, callback?: (data: any) => void): void {
    if (!isShowPinned(id)) {
        loadShow(validateId(id), (data: any) => {
            let pin: any = null;
            if (data.data != null && tvx.Tools.isNum(data.data.id) && tvx.Tools.isFullStr(data.data.title)) {
                pinnedShowsMap = null;
                pin = addPin(pinnedShowsList, {
                    id: "" + data.data.id,
                    title: data.data.title
                });
            }
            callCallback(storePins(PINNED_SHOWS_ID, pinnedShowsList, pin), callback);
        });
    } else {
        callCallback(null, callback);
    }
}

export function unpinShow(id: string | number): any {
    if (isShowPinned(id)) {
        pinnedShowsMap = null;
        return storePins(PINNED_SHOWS_ID, pinnedShowsList, removePin(pinnedShowsList, validateId(id)));
    }
    return null;
}

export function getPinnedBeans(): any {
    return validateList(pinnedBeansList);
}

export function getPinnedBean(id: string | number): any {
    pinnedBeansMap = validateMap(pinnedBeansMap, pinnedBeansList);
    return getPin(pinnedBeansMap, pinnedBeansList, validateId(id));
}

export function isBeanPinned(id: string | number): boolean {
    return getPinnedBean(id) != null;
}

export function movePinnedBean(id: string | number, direction: string): any {
    return storePins(PINNED_BEANS_ID, pinnedBeansList, movePin(pinnedBeansList, validateId(id), direction));
}

export function pinBean(id: string | number, callback?: (data: any) => void): void {
    if (!isBeanPinned(id)) {
        loadBean(validateId(id), (data: any) => {
            let pin: any = null;
            if (data.data != null && tvx.Tools.isNum(data.data.mgmtid) && tvx.Tools.isFullStr(data.data.computedName)) {
                pinnedBeansMap = null;
                pin = addPin(pinnedBeansList, {
                    id: "" + data.data.mgmtid,
                    name: data.data.computedName
                });
            }
            callCallback(storePins(PINNED_BEANS_ID, pinnedBeansList, pin), callback);
        });
    } else {
        callCallback(null, callback);
    }
}

export function unpinBean(id: string | number): any {
    if (isBeanPinned(id)) {
        pinnedBeansMap = null;
        return storePins(PINNED_BEANS_ID, pinnedBeansList, removePin(pinnedBeansList, validateId(id)));
    }
    return null;
}