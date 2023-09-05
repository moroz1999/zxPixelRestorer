window.dataStorage = new function () {
    let self = this;
    this.addUpdateListener = function (itemName, callback) {
        if (!listenersIndex[itemName]) {
            listenersIndex[itemName] = [];
        }
        for (let i = 0; i < listenersIndex[itemName].length; i++) {
            if (listenersIndex[itemName][i] === callback) {
                return;
            }
        }
        listenersIndex[itemName].push(callback);
    };
    this.getItem = function (itemName) {
        let value;
        try {
            value = JSON.parse(localStorage.getItem(itemName));
        } catch (e) {
            value = false;
        }
        return value;
    };
    this.setItem = function (itemName, value) {
        return localStorage.setItem(itemName, JSON.stringify(value));
    };
    this.fireAllListeners = function () {
        for (let itemName in listenersIndex) {
            if (listenersIndex.hasOwnProperty(itemName)) {
                for (let i = 0; i < listenersIndex[itemName].length; i++) {
                    if (typeof listenersIndex[itemName][i] == 'function') {
                        let value;
                        try {
                            value = JSON.parse(localStorage.getItem(itemName));
                        } catch (e) {
                            value = false;
                        }
                        listenersIndex[itemName][i](value, itemName);
                    }
                }
            }
        }
    };
    this.removeAll = function () {
        for (let itemName in listenersIndex) {
            if (listenersIndex.hasOwnProperty(itemName)) {
                localStorage.removeItem(itemName);
            }
        }
        self.fireAllListeners();
    };

    let listenersIndex = {};
};
window.SizeAdjusterComponent = new function () {
    let self = this;
    let componentElement;
    let canvasContainerElement;
    let imageElement;

    let controlsComponent;
    let containerComponent;
    let previewCanvasElement;
    let convertCanvasElement;
    let imageLoaderComponent;
    let convertCanvasContainerElement;
    let canvasTopElement;
    let canvasTopContentElement;
    let canvasBottomElement;
    let canvasBottomContentElement;
    let canvasLeftElement;
    let canvasLeftContentElement;
    let canvasRightElement;
    let canvasRightContentElement;

    let topSelectors = [];
    let bottomSelectors = [];
    let leftSelectors = [];
    let rightSelectors = [];
    let attributesH = 32;
    let attributesV = 24;
    let startXAttr = 0;
    let startYAttr = 0;
    let infoBlock;

    let zoom = 2;
    let pointsList = [];
    let pointOver = null;
    let selectedPoints;
    let manualPoints = {};

    let init = function () {
        let element, i, selector;
        dataStorage.addUpdateListener('manualPoints', dataUpdateHandler);

        if ((componentElement = document.querySelector('.converter_component'))) {
            element = componentElement.querySelector('.fileselect_block');
            if (element) {
                imageLoaderComponent = new SizeAdjusterLoaderComponent(element, self);
            }
            if ((canvasContainerElement = componentElement.querySelector('.canvas_block'))) {
                containerComponent = new SizeAdjusterCanvasContainerComponent(canvasContainerElement, self);
            }
            convertCanvasContainerElement = componentElement.querySelector('.convert_canvas_block');
            infoBlock = componentElement.querySelector('.info_block')
            if ((canvasTopElement = componentElement.querySelector('.canvas_top_block'))) {
                canvasTopContentElement = canvasTopElement.querySelector('.canvas_top_content');
                for (i = 0; i < attributesH + 1; i++) {
                    selector = new XCoordinateSelectorComponent(i, self, 'top');
                    canvasTopContentElement.appendChild(selector.componentElement);
                    topSelectors.push(selector);
                }
            }
            if ((canvasBottomElement = componentElement.querySelector('.canvas_bottom_block'))) {
                canvasBottomContentElement = canvasBottomElement.querySelector('.canvas_bottom_content');
                for (i = 0; i < attributesH + 1; i++) {
                    selector = new XCoordinateSelectorComponent(i, self, 'bottom');
                    canvasBottomContentElement.appendChild(selector.componentElement);
                    bottomSelectors.push(selector);
                }
            }
            if ((canvasLeftElement = componentElement.querySelector('.canvas_left_block'))) {
                canvasLeftContentElement = canvasLeftElement.querySelector('.canvas_left_content');
                for (i = 0; i < attributesV + 1; i++) {
                    selector = new YCoordinateSelectorComponent(i, self, 'left');
                    canvasLeftContentElement.appendChild(selector.componentElement);
                    leftSelectors.push(selector);
                }
            }
            if ((canvasRightElement = componentElement.querySelector('.canvas_right_block'))) {
                canvasRightContentElement = canvasRightElement.querySelector('.canvas_right_content');
                for (i = 0; i < attributesV + 1; i++) {
                    selector = new YCoordinateSelectorComponent(i, self, 'right');
                    canvasRightContentElement.appendChild(selector.componentElement);
                    rightSelectors.push(selector);
                }
            }

            element = document.querySelector('.controls_block');
            if (element) {
                controlsComponent = new SizeAdjusterControlsComponent(element, self, containerComponent);
            }
            reinitPoints();

            window.addEventListener('keydown', keyDownHandler);
        }
        dataStorage.fireAllListeners();
    };
    let reinitPoints = function () {
        manualPoints = {};
        selectedPoints = {};
        let i = 0;
        for (let x = 0; x < attributesH * 8; x++) {
            for (let y = 0; y < attributesV * 8; y++) {
                const point = {
                    i: i,
                    x: 0,
                    y: 0,
                    oldX: null,
                    oldY: null,
                    selected: false, //selected
                    changed: true,  //changed
                    manual: false, //manual
                    over: false,
                    zxX: x,
                    zxY: y
                };
                pointsList.push(point);
                i++;
            }
        }
    };
    let dataUpdateHandler = function (dataValue) {
        if (dataValue) {
            for (let i in dataValue) {
                pointsList[i].oldX = null;
                pointsList[i].oldY = null;
                pointsList[i].manual = true;
                pointsList[i].changed = true;
                pointsList[i].over = false;
                pointsList[i].x = dataValue[i].x;
                pointsList[i].y = dataValue[i].y;
                manualPoints[i] = pointsList[i];
            }
        }
    };
    let keyDownHandler = function (event) {
        let i;
        if (event.keyCode === 37) {
            for (i = 0; i < selectedPoints.length; i++) {
                selectedPoints[i].x--;
                selectedPoints[i].changed = true;
                selectedPoints[i].manual = true;
                selectedPoints[i].oldX = selectedPoints[i].x;
                selectedPoints[i].oldY = selectedPoints[i].y;
                manualPoints[selectedPoints[i].i] = selectedPoints[i];
            }
            containerComponent.updateMarkingsCanvas(pointsList, startXAttr, startYAttr);
        }
        if (event.keyCode === 39) {
            for (i = 0; i < selectedPoints.length; i++) {
                selectedPoints[i].x++;
                selectedPoints[i].changed = true;
                selectedPoints[i].manual = true;
                selectedPoints[i].oldX = selectedPoints[i].x;
                selectedPoints[i].oldY = selectedPoints[i].y;
                manualPoints[selectedPoints[i].i] = selectedPoints[i];
            }
            containerComponent.updateMarkingsCanvas(pointsList, startXAttr, startYAttr);
        }
        if (event.keyCode === 38) {
            for (i = 0; i < selectedPoints.length; i++) {
                selectedPoints[i].y--;
                selectedPoints[i].changed = true;
                selectedPoints[i].manual = true;
                selectedPoints[i].oldX = selectedPoints[i].x;
                selectedPoints[i].oldY = selectedPoints[i].y;
                manualPoints[selectedPoints[i].i] = selectedPoints[i];
            }
            containerComponent.updateMarkingsCanvas(pointsList, startXAttr, startYAttr);
        }
        if (event.keyCode === 40) {
            for (i = 0; i < selectedPoints.length; i++) {
                selectedPoints[i].y++;
                selectedPoints[i].changed = true;
                selectedPoints[i].manual = true;
                selectedPoints[i].oldX = selectedPoints[i].x;
                selectedPoints[i].oldY = selectedPoints[i].y;
                manualPoints[selectedPoints[i].i] = selectedPoints[i];
            }
            containerComponent.updateMarkingsCanvas(pointsList, startXAttr, startYAttr);
        }
        dataStorage.setItem('manualPoints', manualPoints);
    };
    this.resetSelectedPointsPositions = function () {
        let i;
        for (i = 0; i < selectedPoints.length; i++) {
            selectedPoints[i].changed = true;
            selectedPoints[i].manual = false;
            selectedPoints[i].selected = false;
            delete manualPoints[selectedPoints[i].i];
        }
        self.updateMarkings();
    };
    this.setPointsSelected = function (minX, maxX, minY, maxY) {
        selectedPoints = [];
        for (let i = pointsList.length; i--;) {
            const point = pointsList[i];
            if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
                if (!point.selected) {
                    point.selected = true;
                    point.changed = true;
                }
                selectedPoints.push(point);
            } else if (point.selected) {
                point.selected = false;
                point.changed = true;
            }
        }
        containerComponent.updateMarkingsCanvas(pointsList, startXAttr, startYAttr);
    };
    this.updateSizes = function (w, h) {
        let scrollW = canvasContainerElement.offsetWidth - canvasContainerElement.clientWidth;
        let scrollH = canvasContainerElement.offsetHeight - canvasContainerElement.clientHeight;

        canvasTopElement.style.right = scrollW + 30 + 'px';
        canvasBottomElement.style.right = scrollW + 30 + 'px';
        canvasLeftElement.style.bottom = scrollH + 30 + 'px';
        canvasRightElement.style.bottom = scrollH + 30 + 'px';

        if (canvasTopContentElement) {
            canvasTopContentElement.style.width = w + 'px';
        }
        if (canvasBottomContentElement) {
            canvasBottomContentElement.style.width = w + 'px';
        }
        if (canvasLeftContentElement) {
            canvasLeftContentElement.style.height = h + 'px';
        }
        if (canvasRightContentElement) {
            canvasRightContentElement.style.height = h + 'px';
        }
    };
    let updatePreviewCanvas = function () {
        if (previewCanvasElement) {
            previewCanvasElement.parentNode.removeChild(previewCanvasElement);
        }

        previewCanvasElement = document.createElement('canvas');
        previewCanvasElement.style.position = 'fixed';
        previewCanvasElement.style.top = '0';
        previewCanvasElement.style.right = '0';
        previewCanvasElement.width = containerComponent.zxWidth;
        previewCanvasElement.height = containerComponent.zxHeight;
        canvasContainerElement.appendChild(previewCanvasElement);

        let canvasCoordinate;
        let previewCanvasCoordinate;

        let previewContext = previewCanvasElement.getContext('2d');

        let context = containerComponent.canvasElement.getContext('2d');
        let canvasW = containerComponent.canvasElement.width;
        let canvasH = containerComponent.canvasElement.height;

        let canvasData = context.getImageData(0, 0, canvasW, canvasH);
        let previewData = previewContext.createImageData(containerComponent.zxWidth, containerComponent.zxHeight);

        for (let i = pointsList.length; i--;) {
            let point = pointsList[i];
            let x = point.x / zoom;
            let y = point.y / zoom;

            if (x >= 0 && y >= 0 && x < canvasW && y < canvasH) {
                canvasCoordinate = (Math.floor(y) * canvasW + Math.floor(x)) * 4;
                previewCanvasCoordinate = (point.zxY * containerComponent.zxWidth + point.zxX) * 4;
                previewData.data[previewCanvasCoordinate] = canvasData.data[canvasCoordinate];
                previewData.data[previewCanvasCoordinate + 1] = canvasData.data[canvasCoordinate + 1];
                previewData.data[previewCanvasCoordinate + 2] = canvasData.data[canvasCoordinate + 2];
                previewData.data[previewCanvasCoordinate + 3] = 255;
            }

        }

        previewContext.putImageData(previewData, 0, 0);
    };
    this.updateScroll = function (x, y) {
        if (canvasTopElement) {
            canvasTopElement.scrollLeft = x;
        }
        if (canvasBottomElement) {
            canvasBottomElement.scrollLeft = x;
        }
        if (canvasLeftElement) {
            canvasLeftElement.scrollTop = y;
        }
        if (canvasRightElement) {
            canvasRightElement.scrollTop = y;
        }
    };
    this.updateSelectors = function (xStart, yStart, xStep, yStep, xAttr, yAttr, zoom) {
        startXAttr = xAttr;
        startYAttr = yAttr;

        xStart = xStart * zoom;
        yStart = yStart * zoom;
        let i;
        for (i = 0; i < topSelectors.length; i++) {
            topSelectors[i].updateBaseCoordinate(xStart, xStep, xAttr);
        }
        for (i = 0; i < bottomSelectors.length; i++) {
            bottomSelectors[i].updateBaseCoordinate(xStart, xStep, xAttr);
        }
        for (i = 0; i < leftSelectors.length; i++) {
            leftSelectors[i].updateBaseCoordinate(yStart, yStep, yAttr);
        }
        for (i = 0; i < rightSelectors.length; i++) {
            rightSelectors[i].updateBaseCoordinate(yStart, yStep, yAttr);
        }
        self.updateMarkings();
    };
    this.updateMarkings = function () {
        let linesV = [];
        let n, i;
        for (i = 0; i < attributesH; i++) {
            let t = topSelectors[i].getAbsCoordinate();
            let b = bottomSelectors[i].getAbsCoordinate();

            let tStep = (topSelectors[i + 1].getAbsCoordinate() - t) / 8;
            let bStep = (bottomSelectors[i + 1].getAbsCoordinate() - b) / 8;
            for (n = 0; n < 8; n++) {
                linesV.push([t + n * tStep, b + n * bStep]);
            }
        }
        let linesH = [];
        for (i = 0; i < attributesV; i++) {
            let l = leftSelectors[i].getAbsCoordinate();
            let r = rightSelectors[i].getAbsCoordinate();

            let lStep = (leftSelectors[i + 1].getAbsCoordinate() - l) / 8;
            let rStep = (rightSelectors[i + 1].getAbsCoordinate() - r) / 8;
            for (n = 0; n < 8; n++) {
                linesH.push([l + n * lStep, r + n * rStep]);
            }
        }

        let canvasW = containerComponent.getCanvasWidth();
        let canvasH = containerComponent.getCanvasHeight();

        for (i = 0; i < pointsList.length; i++) {
            if (!pointsList[i].manual) {
                let x = pointsList[i].zxX;
                let y = pointsList[i].zxY;
                checkIntersection(linesV[x][0], 0, linesV[x][1], canvasH, 0, linesH[y][0], canvasW, linesH[y][1], pointsList[i]);
            }
        }
        if (containerComponent) {
            containerComponent.updateMarkingsCanvas(pointsList, startXAttr, startYAttr);
        }
    };
    let checkIntersection = function (x11, y11, x12, y12, x21, y21, x22, y22, point) {
        let d = (x12 - x11) * (y21 - y22) - (x21 - x22) * (y12 - y11);

        if (d === 0) {
            alert('intersection error')
        }

        let d1 = (x21 - x11) * (y21 - y22) - (x21 - x22) * (y21 - y11);
        let d2 = (x12 - x11) * (y21 - y11) - (x21 - x11) * (y12 - y11);

        let t1 = d1 / d;
        let t2 = d2 / d;

        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
            let x = Math.floor(t1 * x12 + (1 - t1) * x11);
            let y = Math.floor(t1 * y12 + (1 - t1) * y11);
            if (point.x !== x || point.y !== y) {
                point.oldX = point.x;
                point.oldY = point.y;
                point.x = x;
                point.y = y;
                point.changed = true;
            }
        }
    };
    this.resetAll = function () {
        dataStorage.removeAll();
        reinitPoints();
    };
    this.updatePreview = function () {
        updatePreviewCanvas();
    };
    this.convert = function () {
        updatePreviewCanvas();

        let previewContext = previewCanvasElement.getContext('2d');
        let previewImageData = previewContext.getImageData(0, 0, previewCanvasElement.width, previewCanvasElement.height);

        if (convertCanvasElement) {
            convertCanvasElement.parentNode.removeChild(convertCanvasElement);
        }

        convertCanvasElement = document.createElement('canvas');
        convertCanvasElement.width = containerComponent.zxWidth;
        convertCanvasElement.height = containerComponent.zxHeight;
        convertCanvasContainerElement.appendChild(convertCanvasElement);

        let convertContext = convertCanvasElement.getContext('2d');
        let convertImageData = convertContext.getImageData(0, 0, convertCanvasElement.width, convertCanvasElement.height);

        let palette = controlsComponent.getPalette();

        let detector = new PaletteDetectionComponent();
        detector.setPalette(palette);
        let detectionResult = detector.convert(previewImageData, convertImageData);
        convertImageData = detectionResult[1];
        let zxImageData = detectionResult[0];
        convertContext.putImageData(convertImageData, 0, 0);
        convertCanvasContainerElement.download = "convert.C";
        convertCanvasContainerElement.href = "data:application/octet-stream;base64," + zxImageData;
    };
    this.loadCanvasData = function (newImageElement) {
        imageElement = newImageElement;
        updateCanvas();
    };
    this.updateZoom = function (newZoom) {
        zoom = newZoom;
        containerComponent.updateZoom(zoom);
        updateCanvas();
    };
    let updateCanvas = function () {
        if (imageElement) {
            containerComponent.setImageContents(imageElement, zoom);
            if (controlsComponent) {
                controlsComponent.forceUpdate();
            }
        }
    };
    this.updateInfo = function (cx, cy, x, y) {
        if (pointOver) {
            pointOver.over = false;
            // containerComponent.updatePoint(pointOver, startXAttr, startYAttr);
            pointOver = null;
        }
        for (let i = pointsList.length; i--;) {
            if ((x < pointsList[i].x + 5) &&
                (x > pointsList[i].x - 5) &&
                (y > pointsList[i].y - 5) &&
                (y > pointsList[i].y - 5)
            ) {
                pointOver = pointsList[i];
                console.log(pointOver);
                break;
            }
        }


        let newInfo = 'x: ' + cx + ' y: ' + cy;
        if (pointOver) {
            pointOver.changed = true;
            pointOver.over = true;
            newInfo += ' point:' + pointOver.i;
            // containerComponent.updatePoint(pointOver, startXAttr, startYAttr);
        }
        infoBlock.innerHTML = newInfo;
    };

    window.addEventListener('load', init, false);
};
window.XCoordinateSelectorComponent = function (number, parentObject, position) {
    let self = this;
    let componentElement;
    let inputElement;
    let numberElement;
    let baseCoordinate = 0;
    let absCoordinate = 0;
    let selfCoordinate = 0;
    let storageItemName = 'xSelector' + position + number;
    this.componentElement = false;
    let init = function () {
        dataStorage.addUpdateListener(storageItemName, dataUpdateHandler);

        componentElement = document.createElement('div');
        componentElement.className = 'x_selector_block';
        self.componentElement = componentElement;
        numberElement = document.createElement('span');
        numberElement.className = 'x_selector_number';
        numberElement.innerHTML = number;
        componentElement.appendChild(numberElement);
        inputElement = document.createElement('input');
        inputElement.className = 'x_selector_input';
        inputElement.type = 'text';
        inputElement.value = '0';
        inputElement.addEventListener('change', changeHandler);
        componentElement.appendChild(inputElement);
    };
    let dataUpdateHandler = function (dataValue) {
        if (dataValue) {
            inputElement.value = dataValue;
        }
        selfCoordinate = parseInt(inputElement.value, 10);
        updatePosition();
    };
    this.updateBaseCoordinate = function (start, step, attr) {
        baseCoordinate = start - (attr * step * 8) + (number * step * 8);
        absCoordinate = baseCoordinate + selfCoordinate;
        updatePosition();
    };
    let updatePosition = function () {
        componentElement.style.left = self.getAbsCoordinate() + 'px';
    };
    this.getAbsCoordinate = function () {
        absCoordinate = baseCoordinate + selfCoordinate;
        return absCoordinate;
    };
    let changeHandler = function () {
        if (inputElement.value !== '') {
            selfCoordinate = parseInt(inputElement.value, 10);
            updatePosition();
            dataStorage.setItem(storageItemName, selfCoordinate);
            parentObject.updateMarkings();
        }
    };

    init();
};
window.YCoordinateSelectorComponent = function (number, parentObject, position) {
    let self = this;
    let componentElement;
    let inputElement;
    let numberElement;
    let baseCoordinate = 0;
    let absCoordinate = 0;
    let selfCoordinate = 0;
    let storageItemName = 'ySelector' + position + number;
    this.componentElement = false;
    let init = function () {
        dataStorage.addUpdateListener(storageItemName, dataUpdateHandler);

        componentElement = document.createElement('div');
        componentElement.className = 'y_selector_block';
        self.componentElement = componentElement;
        numberElement = document.createElement('div');
        numberElement.className = 'y_selector_number';
        numberElement.innerHTML = number;
        componentElement.appendChild(numberElement);
        inputElement = document.createElement('input');
        inputElement.className = 'y_selector_input';
        inputElement.type = 'text';
        inputElement.size = 1;
        inputElement.value = '0';
        inputElement.addEventListener('change', changeHandler);
        componentElement.appendChild(inputElement);
    };
    let dataUpdateHandler = function (dataValue) {
        if (dataValue) {
            inputElement.value = dataValue;
        }
        selfCoordinate = parseInt(inputElement.value, 10);
        updatePosition();
    };
    this.updateBaseCoordinate = function (start, step, attr) {
        baseCoordinate = start - (attr * step * 8) + (number * step * 8);
        absCoordinate = baseCoordinate + selfCoordinate;
        updatePosition();
    };
    let updatePosition = function () {
        componentElement.style.top = self.getAbsCoordinate() + 'px';
    };
    this.getAbsCoordinate = function () {
        absCoordinate = baseCoordinate + selfCoordinate;
        return absCoordinate;
    };
    let changeHandler = function () {
        if (inputElement.value !== '') {
            selfCoordinate = parseInt(inputElement.value, 10);
            dataStorage.setItem(storageItemName, selfCoordinate);
            updatePosition();
            parentObject.updateMarkings();
        }
    };

    init();
};
window.SizeAdjusterControlsComponent = function (componentElement, parentObject, canvasContainer) {
    let self = this;
    let xStepInput;
    let yStepInput;
    let xStartInput;
    let yStartInput;
    let xAttrInput;
    let yAttrInput;
    let zoomInput;
    let zoomButton;
    let previewButton;
    let convertButton;
    let resetAllButton;
    let resetSelectedButton;
    let colorSelectionElement;
    let colorSelectorComponents;

    let zoom = 4;
    let xStep = 0;
    let yStep = 0;
    let xStart = 0;
    let yStart = 0;
    let xAttr = 0;
    let yAttr = 0;

    let init = function () {
        colorSelectorComponents = [];
        if ((colorSelectionElement = componentElement.querySelector('.color_selection'))) {
            let colorSelectorElements = colorSelectionElement.querySelectorAll('.color_selector_component');
            if (colorSelectorElements) {
                for (let i = 0; i < colorSelectorElements.length; i++) {
                    colorSelectorComponents.push(new SizeAdjusterColorSelectorComponent(colorSelectorElements[i], self, canvasContainer));
                }
            }
        }

        if ((zoomInput = componentElement.querySelector('.zoom_input'))) {
            zoomInput.addEventListener('change', zoomInputChange, false);
            if ((zoomButton = componentElement.querySelector('.zoom_button'))) {
                zoomButton.addEventListener('click', zoomButtonClick, false);
            }
        }
        if ((xStepInput = componentElement.querySelector('.xstep_input'))) {
            xStepInput.addEventListener('change', xStepInputChange, false);
        }
        if ((yStepInput = componentElement.querySelector('.ystep_input'))) {
            yStepInput.addEventListener('change', yStepInputChange, false);
        }
        if ((xAttrInput = componentElement.querySelector('.xattr_input'))) {
            xAttrInput.addEventListener('change', xAttrInputChange, false);
        }
        if ((yAttrInput = componentElement.querySelector('.yattr_input'))) {
            yAttrInput.addEventListener('change', yAttrInputChange, false);
        }
        if ((xStartInput = componentElement.querySelector('.xstart_input'))) {
            xStartInput.addEventListener('change', xStartInputChange, false);
        }
        if ((yStartInput = componentElement.querySelector('.ystart_input'))) {
            yStartInput.addEventListener('change', yStartInputChange, false);
        }
        if ((previewButton = componentElement.querySelector('.preview_button'))) {
            previewButton.addEventListener('click', previewButtonClick, false);
        }
        if ((convertButton = componentElement.querySelector('.convert_button'))) {
            convertButton.addEventListener('click', convertButtonClick, false);
        }
        if ((resetAllButton = componentElement.querySelector('.resetall_button'))) {
            resetAllButton.addEventListener('click', resetAllButtonClick, false);
        }
        if ((resetSelectedButton = componentElement.querySelector('.resetselected_button'))) {
            resetSelectedButton.addEventListener('click', resetSelectedButtonClick, false);
        }
        dataStorage.addUpdateListener('xStep', dataUpdateHandler);
        dataStorage.addUpdateListener('yStep', dataUpdateHandler);
        dataStorage.addUpdateListener('xStart', dataUpdateHandler);
        dataStorage.addUpdateListener('yStart', dataUpdateHandler);
        dataStorage.addUpdateListener('zoom', dataUpdateHandler);
        dataStorage.addUpdateListener('xAttr', dataUpdateHandler);
        dataStorage.addUpdateListener('yAttr', dataUpdateHandler);
    };
    let dataUpdateHandler = function (dataValue, dataName) {
        if (dataName === 'xStep') {
            if (dataValue) {
                xStepInput.value = dataValue;
            } else {
                xStepInput.value = xStepInput.defaultValue;
            }
            xStep = parseFloat(xStepInput.value);
        } else if (dataName === 'yStep') {
            if (dataValue) {
                yStepInput.value = dataValue;
            } else {
                yStepInput.value = yStepInput.defaultValue;
            }
            yStep = parseFloat(yStepInput.value);
        } else if (dataName === 'xStart') {
            if (dataValue) {
                xStartInput.value = dataValue;
            } else {
                xStartInput.value = xStartInput.defaultValue;
            }
            xStart = parseFloat(xStartInput.value);
        } else if (dataName === 'yStart') {
            if (dataValue) {
                yStartInput.value = dataValue;
            } else {
                yStartInput.value = yStartInput.defaultValue;
            }
            yStart = parseFloat(yStartInput.value);
        } else if (dataName === 'xAttr') {
            if (dataValue) {
                xAttrInput.value = dataValue;
            } else {
                xAttrInput.value = xAttrInput.defaultValue;
            }
            xAttr = parseFloat(xAttrInput.value);
        } else if (dataName === 'yAttr') {
            if (dataValue) {
                yAttrInput.value = dataValue;
            } else {
                yAttrInput.value = yAttrInput.defaultValue;
            }
            yAttr = parseFloat(yAttrInput.value);
        } else if (dataName === 'zoom') {
            if (dataValue) {
                zoomInput.value = dataValue;
            } else {
                zoomInput.value = zoomInput.defaultValue;
            }
            zoom = parseFloat(zoomInput.value);
            parentObject.updateZoom(zoom);
        }
    };
    this.getPalette = function () {
        let palette = {};
        for (let i = 0; i < colorSelectorComponents.length; i++) {
            palette[colorSelectorComponents[i].getCode()] = colorSelectorComponents[i].getColor();
        }
        return palette;
    };
    let zoomInputChange = function () {
        zoom = parseFloat(zoomInput.value);
        if (zoom > 0) {
            dataStorage.setItem('zoom', zoom);
        }
    };
    let xStepInputChange = function () {
        xStep = parseFloat(xStepInput.value);
        if (xStep > 0) {
            dataStorage.setItem('xStep', xStep);
            updateParentElement();
        }
    };
    let yStepInputChange = function () {
        yStep = parseFloat(yStepInput.value);
        if (yStep > 0) {
            dataStorage.setItem('yStep', yStep);
            updateParentElement();
        }
    };
    let xStartInputChange = function () {
        xStart = parseFloat(xStartInput.value);
        dataStorage.setItem('xStart', xStart);
        updateParentElement();
    };
    let yStartInputChange = function () {
        yStart = parseFloat(yStartInput.value);
        dataStorage.setItem('yStart', yStart);
        updateParentElement();
    };
    let xAttrInputChange = function () {
        xAttr = parseInt(xAttrInput.value, 10);
        dataStorage.setItem('xAttr', xAttr);
        updateParentElement();
    };
    let yAttrInputChange = function () {
        yAttr = parseInt(yAttrInput.value, 10);
        dataStorage.setItem('yAttr', yAttr);
        updateParentElement();
    };
    let updateParentElement = function () {
        parentObject.updateSelectors(xStart, yStart, xStep, yStep, xAttr, yAttr, zoom);
    };
    let previewButtonClick = function () {
        parentObject.updatePreview();
    };
    let convertButtonClick = function () {
        parentObject.convert();
    };
    let resetAllButtonClick = function () {
        if (confirm('Are you sure you want reset all points?')) {
            parentObject.resetAll();
        }
    };
    let resetSelectedButtonClick = function () {
        parentObject.resetSelectedPointsPositions();
    };
    let zoomButtonClick = function () {
        parentObject.updateZoom(zoom);
        updateParentElement();
    };
    this.forceUpdate = updateParentElement;
    init();
};
window.SizeAdjusterColorSelectorComponent = function (componentElement, parentObject, canvasContainer) {
    let inputBlock;
    let colorBlock;
    let numericColor;
    let code;
    let storageItemName;
    let init = function () {
        colorBlock = componentElement.querySelector('.color_selector_color');
        if ((inputBlock = componentElement.querySelector('.color_selector'))) {
            inputBlock.addEventListener('focus', inputBlockFocus, false);
            inputBlock.addEventListener('blur', inputBlockBlur, false);
            inputBlock.addEventListener('change', inputBlockChange, false);

            code = inputBlock.className.split('colorcode_')[1];
            storageItemName = 'color_' + code;
            dataStorage.addUpdateListener(storageItemName, dataUpdateHandler);
        }
    };
    let dataUpdateHandler = function (dataValue) {
        numericColor = 0;
        if (!isNaN(dataValue) && dataValue != null) {
            numericColor = parseInt(dataValue);
        }
        updateContents();
    };
    this.getCode = function () {
        return code;
    };
    this.getColor = function () {
        return numericColor;
    };
    let inputBlockFocus = function () {
        canvasContainer.startCapturing(receiveColor, stopCallback);
        inputBlock.style.backgroundColor = '#d0e000';
    };
    let inputBlockBlur = function (event) {
        if (event.target.tagName.toLowerCase() === 'input') {
            stopCallback();
        } else {
            setTimeout(canvasContainer.stopCapturing, 100);
        }
    };
    let inputBlockChange = function () {
        numericColor = parseInt(inputBlock.value.split('#')[1], 16);
        dataStorage.setItem(storageItemName, numericColor);
        updateContents();
    };
    let stopCallback = function () {
        inputBlock.style.backgroundColor = '#ffffff';
    };
    let receiveColor = function (color) {
        numericColor = color[0] * 65536 + color[1] * 256 + color[2];
        dataStorage.setItem(storageItemName, numericColor);
        updateContents();
    };
    let updateContents = function () {
        let text = '#' + formatNumber(numericColor.toString(16), 6);

        inputBlock.value = text;
        colorBlock.style.backgroundColor = text;
    };
    let formatNumber = function (number, decimals) {
        number = number.toString();
        if (number.length < decimals) {
            for (let a = decimals - number.length; a > 0; a--) {
                number = '0' + number;
            }
        }
        return number;
    };

    init();
};
window.SizeAdjusterCanvasContainerComponent = function (componentElement, parentObject) {
    let self = this;
    let canvasElement;
    let markingsCanvasElement;
    let mouseX = 0;
    let mouseY = 0;
    let mouseCanvasX = 0;
    let mouseCanvasY = 0;
    let capturingCallBack;
    let capturingStopCallBack;
    let canvasWidth;
    let canvasHeight;
    let selectionStartX;
    let selectionStartY;
    this.zxWidth = 256;
    this.zxHeight = 192;
    let zoom = 2;
    this.canvasElement = null;
    let capturingActive = false;

    let selectionFrameElement;

    let init = function () {
        componentElement.addEventListener('scroll', scrollHandler);
        canvasElement = document.createElement('canvas');
        canvasElement.style.position = 'absolute';
        canvasElement.style.top = '0';
        canvasElement.style.left = '0';
        componentElement.appendChild(canvasElement);
        self.canvasElement = canvasElement;

        markingsCanvasElement = document.createElement('canvas');
        markingsCanvasElement.style.position = 'absolute';
        markingsCanvasElement.style.top = '0';
        markingsCanvasElement.style.left = '0';
        componentElement.appendChild(markingsCanvasElement);
        self.markingsCanvasElement = markingsCanvasElement;

        componentElement.addEventListener('mouseleave', mouseLeaveHandler, false);
        componentElement.addEventListener('mousemove', mouseMoveHandler, false);
        componentElement.addEventListener('mousedown', selectionStartHandler, false);
        componentElement.addEventListener('mouseup', selectionEndHandler, false);

        selectionFrameElement = document.createElement('div');
        selectionFrameElement.style.position = 'absolute';
        selectionFrameElement.style.background = 'red';
        selectionFrameElement.style.opacity = '0.3';
        selectionFrameElement.style.border = '1px solid black';
        selectionFrameElement.style.boxSizing = 'border-box';
        selectionFrameElement.style.display = 'none';
        componentElement.appendChild(selectionFrameElement);
    };

    let selectionStartHandler = function (event) {
        event.preventDefault();
        selectionFrameElement.style.display = 'block';
        selectionStartX = mouseX;
        selectionStartY = mouseY;
        selectionFrameElement.style.width = '0';
        selectionFrameElement.style.height = '0';

        componentElement.addEventListener('mousemove', selectionMoveHandler, false);
    };

    let selectionMoveHandler = function (event) {
        event.preventDefault();
        selectionFrameElement.style.left = Math.min(selectionStartX, mouseX) + 'px';
        selectionFrameElement.style.top = Math.min(selectionStartY, mouseY) + 'px';
        selectionFrameElement.style.width = Math.abs(mouseX - selectionStartX) + 'px';
        selectionFrameElement.style.height = Math.abs(mouseY - selectionStartY) + 'px';
    };
    let selectionEndHandler = function (event) {
        event.preventDefault();
        componentElement.removeEventListener('mousemove', selectionMoveHandler, false);
        selectionFrameElement.style.display = 'none';
        let minX = Math.min(selectionStartX, mouseX);
        let maxX = Math.max(selectionStartX, mouseX);
        let minY = Math.min(selectionStartY, mouseY);
        let maxY = Math.max(selectionStartY, mouseY);
        parentObject.setPointsSelected(minX, maxX, minY, maxY);
    };
    let mouseLeaveHandler = function (event) {
        event.preventDefault();
        componentElement.removeEventListener('mousemove', selectionMoveHandler, false);
        selectionFrameElement.style.display = 'none';

    };

    this.getCanvasHeight = function () {
        return canvasHeight;
    };
    this.getCanvasWidth = function () {
        return canvasWidth;
    };

    let scrollHandler = function () {
        parentObject.updateScroll(componentElement.scrollLeft, componentElement.scrollTop);
    };
    let mouseMoveHandler = function (event) {
        let positions = getElementPositions(componentElement);

        mouseX = event.pageX - positions.x + componentElement.scrollLeft;
        mouseY = event.pageY - positions.y + componentElement.scrollTop;
        if (mouseX < 0) {
            mouseX = 0;
        }
        if (mouseY < 0) {
            mouseY = 0;
        }

        mouseCanvasX = (mouseX) / zoom;
        mouseCanvasY = (mouseY) / zoom;
        parentObject.updateInfo(Math.floor(mouseCanvasX), Math.floor(mouseCanvasY), Math.floor(mouseX), Math.floor(mouseY));
    };
    let getElementPositions = function (domElement) {
        let elementLeft = 0;
        let elementTop = 0;
        if (domElement.offsetParent) {
            elementLeft = domElement.offsetLeft;
            elementTop = domElement.offsetTop;
            while ((domElement = domElement.offsetParent)) {
                if (domElement.tagName.toLowerCase() !== 'body') {
                    elementLeft += domElement.offsetLeft - domElement.scrollLeft;
                    elementTop += domElement.offsetTop - domElement.scrollTop;
                } else {
                    elementLeft += domElement.offsetLeft;
                    elementTop += domElement.offsetTop;
                }
            }
        }
        return {x: elementLeft, y: elementTop};
    };
    this.setImageContents = function (imageElement, zoom) {
        canvasWidth = imageElement.width * zoom;
        canvasHeight = imageElement.height * zoom;
        canvasElement.style.width = canvasWidth + 'px';
        canvasElement.style.height = canvasHeight + 'px';
        canvasElement.width = imageElement.width;
        canvasElement.height = imageElement.height;

        let canvasContext = canvasElement.getContext('2d');
        canvasContext.drawImage(imageElement, 0, 0);

        markingsCanvasElement.width = canvasWidth;
        markingsCanvasElement.height = canvasHeight;

        parentObject.updateSizes(canvasWidth, canvasHeight);
    };
    this.startCapturing = function (callBack, stopCallback) {
        capturingActive = true;
        capturingCallBack = callBack;
        capturingStopCallBack = stopCallback;

        componentElement.addEventListener('click', capturingClick, false);
    };
    this.stopCapturing = function () {
        capturingActive = false;
        componentElement.removeEventListener('click', capturingClick, false);

        capturingStopCallBack();
    };
    let capturingClick = function () {
        self.stopCapturing();

        let context = canvasElement.getContext('2d');
        let canvasCoordinate = (Math.floor(mouseCanvasY + 1) * canvasWidth + Math.floor(mouseCanvasX)) * 4;

        let canvasData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        capturingCallBack([
            canvasData.data[canvasCoordinate], canvasData.data[canvasCoordinate + 1],
            canvasData.data[canvasCoordinate + 2]
        ]);
    };
    this.updateMarkingsCanvas = function (pointsList, startXAttr, startYAttr) {
        if (markingsCanvasElement) {
            let context = markingsCanvasElement.getContext('2d');
            let canvasData = context.getImageData(0, 0, canvasWidth, canvasHeight);

            //draw all changed points on new positions
            for (let i = pointsList.length; i--;) {
                const point = pointsList[i];
                if (point.changed) {
                    _updatePoint(point, startXAttr, startYAttr, canvasData);
                }
            }

            context.putImageData(canvasData, 0, 0);
        }
    };
    const _updatePoint = function (point, startXAttr, startYAttr, canvasData) {
        if ((point.oldX !== null) || (point.oldY !== null)) {
            drawPoint(canvasData, point.oldX, point.oldY, 0, 0, 0, 0, 0, 0, 0);
            point.oldX = null;
            point.oldY = null;
        }

        const x = point.x;
        const y = point.y;

        if (point.selected) {
            drawPoint(canvasData, x, y, 0, 0, 0, 255, 255, 255, 255);
        } else if (point.over) {
            drawPoint(canvasData, x, y, 0, 0, 0, 0, 0, 255, 255);
        } else if ((point.zxX === startXAttr * 8) && (point.zxY === startYAttr * 8)) {
            drawPoint(canvasData, x, y, 0, 255, 0, 0, 0, 0, 255);
        } else if ((point.zxX % 8 === 0) && (point.zxY % 8 === 0)) {
            drawPoint(canvasData, x, y, 255, 0, 0, 0, 0, 0, 255);
        } else {
            drawPoint(canvasData, x, y, 255, 255, 0, 0, 0, 0, 255);
        }
        point.changed = false;
    }
    this.updatePoint = function (point, startXAttr, startYAttr) {
        let context = markingsCanvasElement.getContext('2d');
        let canvasData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        _updatePoint(point, startXAttr, startYAttr, canvasData);
        context.putImageData(canvasData, 0, 0);

    }
    let drawPoint = function (canvasData, x, y, r, g, b, r2, g2, b2, alpha) {
        x = Math.floor(x);
        y = Math.floor(y);
        setMarking(x + 1, y + 1, canvasData, r2, g2, b2, alpha);
        setMarking(x - 1, y + 1, canvasData, r2, g2, b2, alpha);

        setMarking(x, y + 1, canvasData, r, g, b, alpha);
        setMarking(x, y, canvasData, r, g, b, alpha);
        setMarking(x + 1, y, canvasData, r, g, b, alpha);
        setMarking(x - 1, y, canvasData, r, g, b, alpha);
        setMarking(x, y - 1, canvasData, r, g, b, alpha);

        setMarking(x + 1, y - 1, canvasData, r2, g2, b2, alpha);
        setMarking(x - 1, y - 1, canvasData, r2, g2, b2, alpha);
    };
    let setMarking = function (x, y, canvasData, r, g, b, a) {
        let canvasCoordinate = (y * canvasWidth + x) * 4;
        if (canvasCoordinate > 0 && canvasCoordinate < canvasData.data.length) {
            canvasData.data[canvasCoordinate] = r;
            canvasData.data[canvasCoordinate + 1] = g;
            canvasData.data[canvasCoordinate + 2] = b;
            canvasData.data[canvasCoordinate + 3] = a;
        }
    };
    this.updateZoom = function (newZoom) {
        zoom = newZoom;
    };
    init();
};
window.SizeAdjusterLoaderComponent = function (componentElement, parentObject) {
    let filesInput;
    let button;
    let init = function () {

        if ((filesInput = componentElement.querySelector('.fileselect_input'))) {
            if ((button = componentElement.querySelector('.fileselect_button'))) {
                button.addEventListener('click', buttonClickHandler, false);
            }
        }

    };
    let buttonClickHandler = function () {
        if (filesInput.files.length > 0) {
            importFilesInfo(filesInput.files);
        }
    };
    let importFilesInfo = function (files) {
        for (let i = 0; i < files.length; i++) {
            if (files[i].type.search(/image\/.*/) !== -1) {
                let reader = new FileReader();
                reader.onload = fileLoadEndHandler;
                reader.readAsDataURL(files[i]);

                break;
            }
        }
    };
    let fileLoadEndHandler = function (event) {
        let imageElement = new Image();
        imageElement.onload = function () {
            parentObject.loadCanvasData(imageElement);
        };
        imageElement.src = event.target.result;
    };
    init();
};