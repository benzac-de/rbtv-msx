let polyfixed: boolean = false;

export function polyfix(): void {
    if (!polyfixed) {
        polyfixed = true;
        //Add Symbol fix
        if (typeof Symbol == "undefined") {
            window.Symbol = undefined;
        }
        //Add URL fix
        if (typeof URL == "undefined" || !URL.prototype.hasOwnProperty("href")) {
            //@ts-ignore
            window.URL = function (url: string) {
                this.href = url;
            };
        }
    }
}