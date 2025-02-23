import $ from "jquery";
import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { INFO, SETTINGS, callCallback, validatePlugin } from "./tools";
import { loadMenu, executeMenu } from "./menu";
import { loadContent, executeContent } from "./content";
import { loadVideo, executeVideo } from "./video";
import { ContentController } from "./content-controller";
import { isImageLoaded, loadImage } from "./backdrop";
import { initPins } from "./pins";
import { initHistory } from "./history";
import { polyfix } from "./parcel-polyfix";

polyfix();

class RbtvHandler implements tvx.TVXInteractionPluginHandler {
    private contentController: ContentController = new ContentController();

    private backdropSwap: number = 0;
    private backdropUrl: string = null;
    private backdropGround: any = null;
    private backdropContainer1: any = null;
    private backdropContainer2: any = null;
    private backdropImage1: any = null;
    private backdropImage2: any = null;

    private hideBackdropImage(): void {
        tvx.Renderer.fadeOut(this.backdropImage1);
        tvx.Renderer.fadeOut(this.backdropImage2);
    }

    private showBackdropImage(): void {
        tvx.Renderer.fadeIn(this.backdropImage1);
        tvx.Renderer.fadeIn(this.backdropImage2);
    }

    private hideBackdrop(): void {
        tvx.Renderer.fadeOut(this.backdropGround);
        tvx.Renderer.fadeOut(this.backdropContainer1);
        tvx.Renderer.fadeOut(this.backdropContainer2);
    }

    private showBackdrop(number: number): void {
        tvx.Renderer.fadeIn(this.backdropGround);
        tvx.Renderer.fadeOut(number == 1 ? this.backdropContainer2 : this.backdropContainer1);
        tvx.Renderer.fadeIn(number == 1 ? this.backdropContainer1 : this.backdropContainer2);
    }

    private loadBackdrop(number: number, url: string): void {
        loadImage(
            number == 1 ? this.backdropContainer1 : this.backdropContainer2,
            number == 1 ? this.backdropImage1 : this.backdropImage2,
            url, null, () => {
                if (this.backdropUrl == url) {
                    this.showBackdrop(number);
                }
            });
    }

    private swapBackdrop(url: string): void {
        if ((url == "none" || tvx.Tools.isHttpUrl(url)) && (this.backdropUrl != url)) {
            this.backdropUrl = url;
            if (url == "none") {
                this.hideBackdrop();
            } else if (isImageLoaded(this.backdropImage1, url)) {
                this.showBackdrop(1);
            } else if (isImageLoaded(this.backdropImage2, url)) {
                this.showBackdrop(2);
            } else if (this.backdropSwap == 0) {
                this.backdropSwap = 1;
                this.loadBackdrop(1, url);
            } else {
                this.backdropSwap = 0;
                this.loadBackdrop(2, url);
            }
        }
    };

    private executeBackdrop(action: string): void {
        if (tvx.Tools.isFullStr(action)) {
            if (action == "expand") {
                this.showBackdropImage();
            } else if (action == "reduce") {
                this.hideBackdropImage();
            } else {
                this.swapBackdrop(action);
            }
        }
    }

    private initBackdrop(): void {
        this.backdropGround = $("#backdropGround");
        this.backdropContainer1 = $("#backdropContainer1");
        this.backdropContainer2 = $("#backdropContainer2");
        this.backdropImage1 = $("#backdropImage1");
        this.backdropImage2 = $("#backdropImage2");
    }

    public init(): void {
        initPins();
        initHistory();
        this.initBackdrop();
        this.contentController.init($(".content-wrapper"));
    }

    public ready(): void {
        tvx.InteractionPlugin.validateSettings((data: tvx.MSXAttachedInfo) => {
            INFO.init(data);
            SETTINGS.init();
        });
        this.contentController.validate();
    }

    public handleEvent(data: tvx.AnyObject): void {
        tvx.PluginTools.handleSettingsEvent(data);
        this.contentController.handleEvent(data);
    }

    public handleData(data: tvx.AnyObject): void {
        if (tvx.Tools.isFullStr(data.message)) {
            if (data.message.indexOf("backdrop:") == 0) {
                this.executeBackdrop(data.message.substr(9));
            } else if (data.message.indexOf("menu:") == 0) {
                executeMenu(data.message.substr(5));
            } else if (data.message.indexOf("content:") == 0) {
                executeContent(data.message.substr(8), data.data);
            } else if (data.message.indexOf("video:") == 0) {
                executeVideo(data.message.substr(6));
            } else {
                tvx.InteractionPlugin.warn("Unknown interaction message: '" + data.message + "'");
            }
        }
    }

    public handleRequest(dataId: string, data: tvx.AnyObject, callback: (respData?: tvx.AnyObject) => void): void {
        if (dataId == "init") {
            loadMenu(callback);
        } else if (dataId.indexOf("content:") == 0) {
            loadContent(dataId.substring(8), callback);
        } else if (dataId.indexOf("video:") == 0) {
            loadVideo(dataId.substring(6), callback);
        } else {
            callCallback({
                error: "Unknown data ID requested: '" + dataId + "'"
            }, callback);
        }
    }
}

tvx.PluginTools.onReady(() => {
    if (validatePlugin()) {
        tvx.InteractionPlugin.setupHandler(new RbtvHandler());
        tvx.InteractionPlugin.init();
    }
});