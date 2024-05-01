"use strict";
const output = document.querySelector('pre#output');
const additionalinfo = document.querySelector('#additionalInfo');
const previewCanvas = document.querySelector('#imgPreview');
const previewCtx = previewCanvas.getContext('2d');
const errorMsg = document.querySelector('#errorMsg');
const widthInput = document.querySelector('input#width');
const fontSizeInput = document.querySelector('#font_size');
const fileInput = document.querySelector('input[type="file"]');
const toInverse = document.querySelector('#inverse');
const useAlpha = document.querySelector('#usealpha');
const useColour = document.querySelector('#usecolour');
const downloadButton = document.querySelector('#download');
const actualMaxWidth = parseInt(widthInput.max);
let maxWidth = parseInt(widthInput.value);
class Image_To_ASCII {
    image;
    resizedImage;
    width;
    height;
    name;
    src;
    ascii;
    useColour;
    detectRGBRegex = /<span style="background-color: rgb\(\d{1,3}, \d{1,3}, \d{1,3}\); color: rgb\(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]), ([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5], ), ([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\); margin: 0px;">([.,:;+*?%S#@$])<\/span>(<br>\n)?/g;
    detectRGBARegex = /<span style="background-color: rgba\(\d{1,3}, \d{1,3}, \d{1,3}, \d{1,3}\); color: rgb\(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]), ([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5], ), ([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]), ([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\); margin: 0px;">([.,:;+*?%S#@$])<\/span>(<br>\n)?/g;
    ASCII_characters = ['.', ',', ':', ';', '+', '*', '?', '%', 'S', '#', '@', '$'];
    advanced_ASCII_characters = [
        '.', '`', ':', "'", '/', '\\', ';', '"', '^', '|', '!', 'i', 'v', '?', '7', '(', ')',
        'r', 't', 'c', 'j', 'l', '*', '{', '}', 's', '1', '5', 'y', 'I', 'J', 'e', '2', '3',
        'o', 'z', '4', 'u', '[', 'a', 'f', ']', 'x', '#', 'n', 'w', 'L', 'V', 'T', 'q', '8',
        'd', '9', 'b', '6', 'p', 'C', 'U', 'F', 'S', 'h', '$', 'Y', 'k', 'g', 'A', 'P', '%',
        'N', 'Z', 'E', 'G', 'O', 'm', 'X', 'W', '&', 'K', 'R', 'D', 'B', 'Q', 'H', 'M', '@'
    ];
    advanced = false;
    constructor(options) {
        this.image = options.image;
        this.resizedImage = new Image();
        this.width = this.image.width;
        this.height = this.image.height;
        this.name = options.name;
        this.src = this.image.src;
        this.ascii = {
            value: "",
            element: document.createElement('span'),
            elementString: "",
            width: 0,
            height: 0
        };
        this.useColour = true;
    }
    async drawPreview() {
        let temp = await resize(this.image, 100);
        previewCanvas.height = temp.height * 2;
        previewCanvas.width = 100;
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.drawImage(temp, 0, 0, temp.width, temp.height * 2);
    }
    async reverseConvert(asciiImage = this.ascii.value) {
        let rgbMatches = [...asciiImage.matchAll(this.detectRGBRegex)];
        let rgbaMatches = [...asciiImage.matchAll(this.detectRGBARegex)];
        let plaintextMatches = [...asciiImage.matchAll(/([.,:;+*?%S#@$])(\n)?/g)];
        let collectedData = [];
        let w = 0, h = 0, i = 0;
        let foundBr = false;
        if (rgbaMatches.length > 0) {
            console.log(rgbaMatches);
            w = rgbaMatches.findIndex((element) => {
                return element[0][1];
            });
            console.log(w);
            if (w == -1)
                return;
            h = rgbaMatches.length * (w / rgbaMatches.length);
            while (i < rgbaMatches.length) {
                let rgb = {
                    r: parseInt(rgbaMatches[i][1]),
                    g: parseInt(rgbaMatches[i][2]),
                    b: parseInt(rgbaMatches[i][3]),
                    a: parseInt(rgbaMatches[i][4])
                };
                collectedData.push(rgb);
                i++;
            }
            const offcanv = new OffscreenCanvas(w, h);
            const offctx = offcanv.getContext('2d', { willReadFrequently: true });
            const imgdata = offctx.getImageData(0, 0, w, h);
            const getInPos = (y) => {
                return y * w * 4;
            };
            for (let y = 0; y < h; y++) {
                let inpos = getInPos(y);
                for (let x = 0; x < w; x++) {
                    let pos = {
                        r: inpos++,
                        g: inpos++,
                        b: inpos++,
                        a: inpos++
                    };
                    let rgb = collectedData[(h * y) + x];
                    imgdata.data[pos.r] = rgb.r;
                    imgdata.data[pos.g] = rgb.g;
                    imgdata.data[pos.b] = rgb.b;
                    imgdata.data[pos.a] = rgb.a;
                }
            }
            offctx.putImageData(imgdata, 0, 0);
            previewCanvas.width = w;
            previewCanvas.height = h * 1.1;
            previewCtx.clearRect(0, 0, w, h);
            previewCtx.drawImage(offcanv, 0, 0, w, h * 2);
        }
        else if (rgbMatches.length > 0) { // merge rgba and rgb regex
            console.log(rgbMatches[0]);
            w = rgbaMatches.findIndex((element) => {
                return element[0][1];
            });
            console.log(w);
            if (w == -1)
                return;
            h = rgbaMatches.length * (w / rgbaMatches.length);
            console.log(w);
            while (i < rgbaMatches.length) {
                let rgb = {
                    r: parseInt(rgbaMatches[i][1]),
                    g: parseInt(rgbaMatches[i][2]),
                    b: parseInt(rgbaMatches[i][3])
                };
                collectedData.push(rgb);
                i++;
            }
            const offcanv = new OffscreenCanvas(w, h);
            const offctx = offcanv.getContext('2d', { willReadFrequently: true });
            const imgdata = offctx.getImageData(0, 0, w, h);
            const getInPos = (y) => {
                return y * w * 4;
            };
            for (let y = 0; y < h; y++) {
                let inpos = getInPos(y);
                for (let x = 0; x < w; x++) {
                    let pos = {
                        r: inpos++,
                        g: inpos++,
                        b: inpos++,
                        a: inpos++
                    };
                    let rgb = collectedData[(h * y) + x];
                    imgdata.data[pos.r] = rgb.r;
                    imgdata.data[pos.g] = rgb.g;
                    imgdata.data[pos.b] = rgb.b;
                    imgdata.data[pos.a] = 255;
                }
            }
            offctx.putImageData(imgdata, 0, 0);
            previewCanvas.width = w;
            previewCanvas.height = h * 1.1;
            previewCtx.clearRect(0, 0, w, h);
            previewCtx.drawImage(offcanv, 0, 0, w, h * 2);
        }
        else if (plaintextMatches) {
            plaintextMatches = [...plaintextMatches];
            while (i < plaintextMatches.length) {
                if (!foundBr) {
                    if (plaintextMatches[i][2]) {
                        // usually one less than the actual width, might become an issue later
                        w = i + 1;
                        h = plaintextMatches.length * (w / plaintextMatches.length);
                        foundBr = true;
                    }
                }
                let char = plaintextMatches[i][1];
                let lightValPercent = this.ASCII_characters.indexOf(char) / this.ASCII_characters.length;
                let lightValue = 255 * (lightValPercent);
                if (char == " ") {
                    lightValue = -1;
                }
                collectedData.push(lightValue);
                i++;
            }
            const offcanv = new OffscreenCanvas(w, h);
            const offctx = offcanv.getContext('2d', { willReadFrequently: true });
            const imgdata = offctx.getImageData(0, 0, w, h);
            const getInPos = (y) => {
                return y * w * 4;
            };
            for (let y = 0; y < h; y++) {
                let inpos = getInPos(y);
                for (let x = 0; x < w; x++) {
                    let pos = {
                        r: inpos++,
                        g: inpos++,
                        b: inpos++,
                        a: inpos++
                    };
                    let lightVal = collectedData[(h * y) + x];
                    if (lightVal !== -1) {
                        imgdata.data[pos.r] = imgdata.data[pos.g] = imgdata.data[pos.b] = lightVal;
                        imgdata.data[pos.a] = 255;
                    }
                }
            }
            offctx.putImageData(imgdata, 0, 0);
            previewCanvas.width = w;
            previewCanvas.height = h * 1.1;
            previewCtx.clearRect(0, 0, w, h);
            previewCtx.drawImage(offcanv, 0, 0, w, h * 2);
        }
        return;
    }
    async convert(image) {
        const width = image.width;
        const height = image.height;
        const offcanv = new OffscreenCanvas(width, height);
        const offctx = offcanv.getContext('2d', { willReadFrequently: true });
        offctx.drawImage(this.image, 0, 0, width, height);
        const imgdata = offctx.getImageData(0, 0, width, height);
        const ascii_to_use = this.ASCII_characters; //this.advanced ? (toInverse.checked ? [...this.advanced_ASCII_characters].reverse() : this.advanced_ASCII_characters) : (toInverse.checked ? [...this.ASCII_characters].reverse() : this.ASCII_characters);
        const getInPos = (y) => {
            return y * width * 4;
        };
        let outputString = "";
        let outputElement = document.createElement('span');
        outputElement.style.margin = '0px';
        let bgDarkMargin = 15;
        let ua = useAlpha.checked;
        for (let y = 0; y < height; y++) {
            let inpos = getInPos(y);
            for (let x = 0; x < width; x++) {
                let pos = {
                    r: inpos++,
                    g: inpos++,
                    b: inpos++,
                    a: inpos++
                };
                let r = imgdata.data[pos.r];
                let g = imgdata.data[pos.g];
                let b = imgdata.data[pos.b];
                let a = imgdata.data[pos.a];
                if (toInverse.checked) {
                    r = 255 - r;
                    g = 255 - g;
                    b = 255 - b;
                }
                let ascii_char = "";
                let av = 255 / 2;
                let lightPercent = 0.5;
                let ascpos = 0;
                if (a == 0 && ua) {
                    ascii_char = " ";
                }
                else {
                    av = (0.3 * r) + (0.59 * g) + (0.11 * b);
                    lightPercent = getPercentOf(av, 0, 255);
                    ascpos = Math.floor(ascii_to_use.length * lightPercent);
                    ascpos = ascpos > this.ASCII_characters.length - 1 ? this.ASCII_characters.length - 1 : ascpos;
                    ascii_char = ascii_to_use[ascpos];
                }
                if (ascii_char === undefined) {
                    console.log(Math.floor(ascii_to_use.length * lightPercent));
                }
                let newPixel = document.createElement('span');
                newPixel.style.backgroundColor = `rgba(${Math.max(r - bgDarkMargin, 0)}, ${Math.max(g - bgDarkMargin, 0)}, ${Math.max(b - bgDarkMargin, 0)}, ${a / 255})`;
                newPixel.style.color = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
                newPixel.style.margin = `0px`;
                newPixel.innerText = ascii_char;
                outputElement.append(newPixel);
                outputString += ascii_char;
            }
            outputString += "\n";
            outputElement.append(document.createElement('br'));
        }
        console.log('converted image to ascii');
        this.ascii = {
            value: outputString,
            element: outputElement,
            elementString: outputElement.innerHTML,
            width: width,
            height: height
        };
        return this.ascii;
    }
    output() {
        if (useColour.checked) {
            this.useColour = true;
        }
        else {
            this.useColour = false;
        }
        if (this.useColour) {
            output.innerText = '';
            while (output.firstChild) {
                output.removeChild(output.lastChild);
            }
            output.append(this.ascii.element);
        }
        else {
            output.innerText = `${this.ascii.value}`;
        }
    }
    textToImage() { }
    async process() {
        console.clear();
        console.log('initialised');
        additionalinfo.innerText = "processing";
        maxWidth = Math.min(actualMaxWidth, maxWidth);
        if (useCharLimitInput.checked === true) {
            let tempSize = getLargestDimensionsWithCharLimit(this.image.width, this.image.height, ((parseInt(charLimitInput.value) && parseInt(charLimitInput.value) > 0 && parseInt(charLimitInput.value) < 750000) ? parseInt(charLimitInput.value) : actualMaxWidth));
            this.resizedImage.width = tempSize.width;
            this.resizedImage.height = tempSize.height;
        }
        else {
            this.resizedImage = await resize(this.image, maxWidth);
        }
        this.ascii = await this.convert(this.resizedImage);
        this.output();
        additionalinfo.innerText = (this.ascii.value.length <= 2000 ? "within normal discord message character limit" : (this.ascii.value.length <= 4000 ? "within discord nitro character limit" : "not within any discord message limit")) + "; length: " + (this.ascii.value.length - this.ascii.height);
        console.log(this.ascii);
    }
    async handlePaste(event) {
        var items = event.clipboardData?.items;
        if (!items)
            return;
        for (let index in items) {
            var item = items[index];
            if (item.kind === "file" && item.type.match("^image/")) {
                var blob = item.getAsFile();
                var reader = new FileReader();
                reader.onload = (e) => {
                    ascii.image = new Image();
                    ascii.image.onload = async () => {
                        ascii.width = ascii.image.width;
                        ascii.height = ascii.image.height;
                        ascii.src = "pasted image";
                        ascii.name = "image";
                        errorMsg.style.display = 'none';
                        await this.drawPreview();
                        this.process();
                        return true;
                    };
                    ascii.image.src = reader.result;
                };
                reader.readAsDataURL(blob);
            }
            else {
                errorMsg.style.display = 'block';
                console.error(`isnt a supported image file!\nsize: ${item.getAsFile()?.size ?? "[unknown]"} bytes`);
                return false;
            }
        }
    }
    async handleFile(input) {
        if (input.files && input.files[0]) {
            console.log(input.files[0]);
            if (input.files[0].type == "image/png" || input.files[0].type == "image/jpg" || input.files[0].type == "image/jpeg" || input.files[0].type == "image/webp" || input.files[0].type == "image/gif") {
                var reader = new FileReader();
                let filename = input.files[0].name;
                let type = input.files[0].type;
                reader.onload = (e) => {
                    ascii.image = new Image();
                    ascii.image.onload = async () => {
                        ascii.width = ascii.image.width;
                        ascii.height = ascii.image.height;
                        ascii.name = filename.replaceAll('.', '-');
                        ascii.src = reader.result;
                        errorMsg.style.display = 'none';
                        await this.drawPreview();
                        this.process();
                        return true;
                    };
                    ascii.image.src = reader.result;
                };
                reader.readAsDataURL(input.files[0]);
            }
            else {
                errorMsg.style.display = 'block';
                console.error(`isnt a supported image file!\nsize: ${input.files[0].size} bytes`);
                return false;
            }
        }
    }
    download(filename, text, type = 'plain') {
        if (type !== 'html' && type !== 'plain')
            return false;
        var element = document.createElement('a');
        let temp = `${text}`;
        if (type == "html") {
            // temp = temp.replaceAll('\n', '<br>\n');
            text = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ASCII ${ascii.name} - TheSomething.uk/ascii/</title>
<style>
#ascii{
    font-size:${(isNaN(parseInt(fontSizeInput.value)) ? 13 : Math.max(parseInt(fontSizeInput.value), 1))}px 
}
</style>
</head>
<body>
<pre id="ascii">
${temp}
</pre>
<br><br>
visit the site here: <a href="https://thesomething.uk/" target="_blank">TheSomething.uk/</a><br>
create your own ascii image here: <a href="https://thesomething.uk/ascii/" target="_blank">TheSomething.uk/ascii/</a><br>
thanks for using it, it was fun to make :]
</body>
</html>
`;
        }
        else {
            text = `${temp}\n
visit the site here: https://TheSomething.uk/
create your own ascii image here: https://TheSomething.uk/ascii/
thanks for using it, it was fun to make :]
`;
        }
        element.setAttribute('href', `data:text/${type};charset=utf-8,` + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        return true;
    }
}
const ascii = new Image_To_ASCII({
    image: new Image(),
    name: "curiositycore"
});
widthInput.addEventListener('change', () => {
    maxWidth = isNaN(parseInt(widthInput.value)) ? maxWidth : parseInt(widthInput.value);
    ascii.process();
});
fontSizeInput.addEventListener('change', () => {
    output.style.fontSize = (isNaN(parseInt(fontSizeInput.value)) ? 13 : parseInt(fontSizeInput.value)) + "px";
});
toInverse.addEventListener('change', () => {
    ascii.process();
});
useAlpha.addEventListener('change', () => {
    ascii.process();
});
useColour.addEventListener('change', () => {
    ascii.output();
});
downloadButton.addEventListener('click', () => {
    let dlType = document.querySelector('#downloadType');
    let currentlySelectedDLType = dlType.options[dlType.selectedIndex].value;
    console.log(!!ascii.ascii.elementString, !!ascii.ascii.value);
    ascii.download(ascii.name, useColour.checked ? ascii.ascii.elementString : ascii.ascii.value, currentlySelectedDLType);
});
const useCharLimitInput = document.querySelector('#useCharLimit');
const charLimitInput = document.querySelector('#charLimit');
/*
useCharLimitInput.addEventListener('change', () => {
    if(useCharLimitInput.checked===true){
        document.querySelector('#charLimitContainer').style.display = "block";
    }else{
        document.querySelector('#charLimitContainer').style.display = "none";
    }
    ascii.process();
});
charLimitInput.addEventListener('change', ()=>{
    ascii.process();
})
*/
fileInput.addEventListener('change', async () => {
    await ascii.handleFile(fileInput);
    ascii.process();
});
document.onpaste = function (e) {
    ascii.handlePaste(e);
};
ascii.image.onload = async () => {
    ascii.process();
    console.log('loaded image');
    await ascii.drawPreview();
};
ascii.image.src = 'curiositycore.png';
const getLargestDimensionsWithCharLimit = function (width, height, max) {
    height /= 2;
    let area = width * height;
    let newPerimiter = Math.sqrt(Math.floor(area / (area / max)));
    let scale = Math.max(newPerimiter / width, newPerimiter / height);
    let newWidth = width * scale;
    let newHeight = height * scale;
    return {
        width: Math.floor(newWidth),
        height: Math.floor(newHeight),
        scale: scale,
        newPerimiter: newPerimiter
    };
};
const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
const preRem = parseFloat(getComputedStyle(document.body.querySelector('pre')).fontSize);
// const ASCII_characters = ['.', ',', ':', ';', '+', '*', '?', '%', 'S', '#', '@'];
//
const getPercentOf = function (val, min = 0, max = 255) {
    return 1 - ((max - val) / (max - min));
};
const imgDataToImage = async function (imgdata, width, height) {
    const cnv = document.createElement('canvas');
    const c = cnv.getContext('2d');
    cnv.width = width;
    cnv.height = height;
    document.body.append(cnv);
    c.putImageData(imgdata, 0, 0);
    var returnImage = new Image();
    returnImage.src = cnv.toDataURL("image/png");
    document.body.removeChild(cnv);
    return returnImage;
};
const resize = async function (img, new_width) {
    const ratio = img.height / img.width / 2;
    new_width = isNaN(new_width) ? parseInt(new_width) : new_width;
    const new_height = (new_width * ratio) | 0;
    let cnvtemp = document.createElement('canvas');
    document.body.append(cnvtemp);
    const id = "temp" + ((Math.random() * 10) | 0);
    cnvtemp.id = id;
    const cnv = document.querySelector(`#${id}`);
    const c = cnv.getContext('2d');
    cnv.width = new_width;
    cnv.height = new_height;
    c.drawImage(img, 0, 0, new_width, new_height);
    var returnImage = new Image();
    returnImage.src = cnv.toDataURL("image/png");
    document.body.removeChild(cnv);
    console.log('resized image');
    return returnImage;
};
//# sourceMappingURL=index.js.map