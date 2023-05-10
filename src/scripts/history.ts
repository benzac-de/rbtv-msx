import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { STORAGE_PREFIX_ID, objToBase64, base64ToObj } from "./tools";

const MAX_HISTORY_LENGTH: number = 24;
const HISTORY_ID: string = "history";

let historyList: any = null;

function storeHistory(): void {
    if (historyList == null || historyList.length == 0) {
        tvx.Services.storage.remove(STORAGE_PREFIX_ID + HISTORY_ID);
    } else {
        tvx.Services.storage.set(STORAGE_PREFIX_ID + HISTORY_ID, objToBase64(historyList));
    }
}

function restoreHistory(): void {
    historyList = base64ToObj(tvx.Services.storage.getFullStr(STORAGE_PREFIX_ID + HISTORY_ID, null));
}

function removeHistoryItem(id: string): void {
    if (historyList != null && historyList.length > 0 && tvx.Tools.isFullStr(id)) {
        for (let i: number = 0; i < historyList.length; i++) {
            if (historyList[i].id == id) {
                historyList.splice(i, 1);
                break;
            }
        }
    }
}

export function initHistory(): void {
    restoreHistory();
}

export function hasHistory(): boolean {
    return historyList != null && historyList.length > 0;
}

export function getHistory(): void {
    return historyList != null ? historyList : [];
}

export function updateHistory(item: any): void {
    if (item != null) {
        removeHistoryItem(item.id);
        if (historyList == null || historyList.length == 0) {
            historyList = [item];
        } else {
            historyList.unshift(item);
            while (historyList.length > MAX_HISTORY_LENGTH) {
                historyList.pop();
            }
        }
        storeHistory();
    }
}

export function clearHistory(): void {
    historyList = null;
    storeHistory();
}