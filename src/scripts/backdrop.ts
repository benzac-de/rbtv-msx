import * as tvx from "./lib/tvx-plugin-ux-module.min";

const MIN_RGB_VALUE: number = 0;
const MAX_RGB_VALUE: number = 255;
const IMAGE_SIZE: number = 16;

let defaultImage: any = null;
let canvas: any = null;
let context: any = null;

function minValue(min: number, value: number): number {
    return value < min ? value : min;
}

function maxValue(max: number, value: number): number {
    return value > max ? value : max;
}

function createPixel(r: number, g: number, b: number): number[] {
    return [r, g, b];
}

function initPixel(value: number): number[] {
    return createPixel(value, value, value);
}

function pushPixel(palette: number[][], r: number, g: number, b: number): void {
    if (palette != null) {
        palette.push(createPixel(r, g, b));
    }
}

function minPixel(min: number[], pixel: number[]): void {
    if (min != null && pixel != null) {
        min[0] = minValue(min[0], pixel[0]);
        min[1] = minValue(min[1], pixel[1]);
        min[2] = minValue(min[2], pixel[2]);
    }
}

function maxPixel(max: number[], pixel: number[]): void {
    if (max != null && pixel != null) {
        max[0] = maxValue(max[0], pixel[0]);
        max[1] = maxValue(max[1], pixel[1]);
        max[2] = maxValue(max[2], pixel[2]);
    }
}

function addPixel(average: number[], pixel: number[]): void {
    if (average != null && pixel != null) {
        average[0] += pixel[0];
        average[1] += pixel[1];
        average[2] += pixel[2];
    }
}

function getPalette(imageData: any): number[][] {
    if (imageData != null && imageData.data != null && imageData.data.length > 0) {
        let data: any = imageData.data;
        let palette: number[][] = [];
        for (let i: number = 0; i < data.length; i += 4) {
            pushPixel(palette, data[i], data[i + 1], data[i + 2]);
        }
        return palette;
    }
    return null;
}

function getMaxRangeIndex(palette: number[][]): number {
    if (palette != null) {
        let length: number = palette.length;
        let min: number[] = initPixel(MAX_RGB_VALUE);
        let max: number[] = initPixel(MIN_RGB_VALUE);
        for (let i: number = 0; i < length; i++) {
            minPixel(min, palette[i]);
            maxPixel(max, palette[i]);
        }
        let ranges: number[] = createPixel(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
        if (ranges[0] >= ranges[1]) {
            return ranges[0] >= ranges[2] ? 0 : 2;
        }
        return ranges[1] >= ranges[2] ? 1 : 2;
    }
    return -1;
}

function calculateLuminance(pixel: number[]): number {
    //Reference: https://en.wikipedia.org/wiki/Luma_(video)
    return pixel != null ? 0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2] : -1;
}

function orderPaletteByIndex(palette: number[][], index: number): void {
    if (palette != null) {
        palette.sort((p1: number[], p2: number[]): number => {
            return p1[index] - p2[index];
        });
    }
}

function orderPaletteByLuminance(palette: number[][]): void {
    if (palette != null) {
        palette.sort((p1: number[], p2: number[]): number => {
            return calculateLuminance(p1) - calculateLuminance(p2);
        });
    }
}

function quantize(result: number[][], palette: number[][], currentDepth: number, maxDepth: number): void {
    if (result != null && palette != null) {
        var length = palette.length;
        if (currentDepth >= maxDepth) {
            var average = initPixel(0);
            for (var i = 0; i < length; i++) {
                addPixel(average, palette[i]);
            }
            pushPixel(result, ~~(average[0] / length), ~~(average[1] / length), ~~(average[2] / length));
        } else {
            var half = ~~(length / 2);
            orderPaletteByIndex(palette, getMaxRangeIndex(palette));
            quantize(result, palette.slice(0, half), currentDepth + 1, maxDepth);
            quantize(result, palette.slice(half + 1), currentDepth + 1, maxDepth);
        }
    }
}

function getColors(imageData: any, depth: number): number[][] {
    //Depth 0 -> 1 Color
    //Depth 1 -> 2 Colors
    //Depth 2 -> 4 Colors
    //Depth 3 -> 8 Colors
    //Depth 4 -> 16 Colors
    if (imageData != null) {
        let result: number[][] = [];
        quantize(result, getPalette(imageData), 0, depth);
        orderPaletteByLuminance(result);
        return result;
    }
    return null;
}

function colorToStr(color: number[], alpha: number): string {
    if (color != null) {
        return alpha >= 0 && alpha < 1 ?
            "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + alpha + ")" :
            "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
    }
    return "";
}

function setupColors(container: any, colors: number[][]): void {
    if (container != null && colors != null && colors.length >= 3) {
        container.css("background",
            "linear-gradient(15deg," + colorToStr(colors[0], 0.8) + "," + colorToStr(colors[0], 0) + " 70%)," +
            "linear-gradient(255deg," + colorToStr(colors[1], 0.8) + "," + colorToStr(colors[1], 0) + " 70%)," +
            "linear-gradient(135deg," + colorToStr(colors[2], 0.8) + "," + colorToStr(colors[2], 0) + " 70%)"
        );
    }
}

function getImageData(image: any): any {
    if (image != null) {
        //Note: We only draw a scaled down version of the image (16x16), because we only want to extract the primary colors
        if (canvas == null) {
            try {
                canvas = document.createElement("canvas");
                canvas.width = IMAGE_SIZE;
                canvas.height = IMAGE_SIZE;
                context = canvas.getContext("2d", {
                    alpha: false,
                    willReadFrequently: true
                });
            } catch (e) {
                tvx.InteractionPlugin.error("Create canvas failed: " + e);
                return null;
            }
        }
        if (context != null) {
            try {
                context.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
                context.drawImage(image, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
            } catch (e) {
                tvx.InteractionPlugin.error("Draw image failed: " + e);
                return null;
            }
            try {
                return context.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
            } catch (e) {
                tvx.InteractionPlugin.error("Get image data failed: " + e);
                return null;
            }
        } else {
            tvx.InteractionPlugin.warn("Context not available");
            return null;
        }
    }
    return null;
}

function setupImage(container: any, image: any): void {
    setupColors(container, getColors(getImageData(image != null ? image.get(0) : null), 2));
}

export function hasImageSource(image: any): boolean {
    return image != null && tvx.Tools.isHttpUrl(image.attr("src"));
}

export function isImageLoaded(image: any, url: string): boolean {
    return image != null && tvx.Tools.isHttpUrl(url) && image.attr("src") == url;
}

export function loadImage(container: any, image: any, url: string, fallbackUrl: string, callback: () => void): void {
    if (container != null && tvx.Tools.isHttpUrl(url)) {
        if (image == null) {
            if (defaultImage == null) {
                defaultImage = $("<img crossorigin='anonymous'/>");
            }
            image = defaultImage;
        }
        if (tvx.Tools.isHttpUrl(fallbackUrl)) {
            tvx.ImageTools.setupFallback(image, fallbackUrl, function () {
                setupImage(container, image);
                if (typeof callback == "function") {
                    callback();
                }
            });
        }
        tvx.ImageTools.loadImage(image, url, false, null, function () {
            setupImage(container, image);
            if (typeof callback == "function") {
                callback();
            }
        });
    }
}