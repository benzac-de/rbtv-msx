import $ from "jquery";
import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { createMenu } from "./menu";
import { loadContent, executeContent, loadVideo } from "./content";
import { callCallback } from "./tools";
import { ContentController } from "./content-controller";
import { loadImage } from "./backdrop";

class RbtvHandler implements tvx.TVXInteractionPluginHandler {
    private contentController: ContentController = new ContentController();
    private backdropUrl: string = null;
    private backdropContainer: any = null;
    private backdropGround: any = null;
    private backdropImage: any = null;

    private hideBackdrop(): void {
        //@ts-ignore
        tvx.Renderer.fadeOut(this.backdropContainer);
        //@ts-ignore
        tvx.Renderer.fadeOut(this.backdropGround);
    }

    private showBackdrop(): void {
        //@ts-ignore
        tvx.Renderer.fadeIn(this.backdropContainer);
        //@ts-ignore
        tvx.Renderer.fadeIn(this.backdropGround);
    }

    private loadBackdrop(url: string): void {
        if (this.backdropUrl != url) {
            this.backdropUrl = url;
            if (tvx.Tools.isFullStr(url) && url != "none") {
                loadImage(this.backdropContainer, this.backdropImage, url, null, () => {
                    this.showBackdrop();
                });
            } else {
                this.hideBackdrop();
            }
        }
    }

    public init(): void {
        this.backdropContainer = $("#backdropContainer");
        this.backdropGround = $("#backdropGround");
        this.backdropImage = $("#backdropImage");
        this.contentController.init($(".content-wrapper"));
    }

    public ready(): void {
        tvx.InteractionPlugin.validateSettings();
        this.contentController.validate();
    }

    public handleEvent(data: tvx.AnyObject): void {
        tvx.PluginTools.handleSettingsEvent(data);
        this.contentController.handleEvent(data);
    }

    public handleData(data: tvx.AnyObject): void {
        if (tvx.Tools.isFullStr(data.message)) {
            if (data.message.indexOf("backdrop:") == 0) {
                this.loadBackdrop(data.message.substr(9));
            } else if (data.message.indexOf("content:") == 0) {
                executeContent(data.message.substr(8));
            }
        }
    }

    public handleRequest(dataId: string, data: tvx.AnyObject, callback: (respData?: tvx.AnyObject) => void): void {
        if (dataId == "init") {
            callCallback(createMenu(), callback);
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
    tvx.InteractionPlugin.setupHandler(new RbtvHandler());
    tvx.InteractionPlugin.init();
});

//Add Symbol fix
if (typeof Symbol == "undefined") {
    window.Symbol = undefined;
}