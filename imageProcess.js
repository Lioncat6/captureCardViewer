let stream, ogCanvas, context, temp, tempContext, viewWidth, viewHeight, frame;
let processingEnabled = false; // Flag to control processing

function init() {
    stream = document.getElementById('video');
    ogCanvas = document.getElementById('processed');
    context = ogCanvas.getContext('2d');

    temp = document.createElement('canvas');
    temp.setAttribute('width', viewWidth);
    temp.setAttribute('height', viewHeight);
    tempContext = temp.getContext('2d');

    stream.addEventListener('play', () => {
        if (processingEnabled) computeFrame();
    });

    // Add event listeners to settings to toggle processing
    document.getElementById('brightness').addEventListener('input', toggleProcessing);
    document.getElementById('matrix').addEventListener('change', toggleProcessing);
}

function computeFrame() {
    if (!processingEnabled) return; // Stop processing if disabled

    tempContext.drawImage(stream, 0, 0, viewWidth, viewHeight);
    frame = tempContext.getImageData(0, 0, viewWidth, viewHeight);

    // Brightness adjustment
    let data = frame.data;
    let level = Number(document.getElementById('brightness').value);
    let len = data.length;
    for (let i = 0; i < len; i += 4) {
        data[i] += level;       // R
        data[i + 1] += level;   // G
        data[i + 2] += level;   // B
    }

    let divisor = 1;
    let offset = level;

    const userInput = document.getElementById('matrix').value;
    let matrix;
    switch (userInput) {
        case 'none':
            matrix = [0, 0, 0, 0, 1, 0, 0, 0, 0];
            break;
        case 'sharpen':
            matrix = [0, -1, 0, -1, 5, -1, 0, -1, 0];
            break;
        case 'edgeDetect':
            matrix = [0, 1, 0, 1, -4, 1, 0, 1, 0];
            break;
        case 'emboss':
            matrix = [-2, 1, 0, -1, 1, 1, 0, 1, 2];
            break;
        case 'blur':
            matrix = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
            break;
    }

    if (userInput !== 'none') {
        frame = convolve(matrix, divisor, offset);
    }

    context.putImageData(frame, 0, 0);
    setTimeout(computeFrame, 0); // Calls itself
}

function toggleProcessing() {
    const brightness = Number(document.getElementById('brightness').value);
    const matrix = document.getElementById('matrix').value;

    // Enable processing if brightness or matrix is set to a value other than default
    processingEnabled = brightness !== 0 || matrix !== 'none';

    if (processingEnabled && stream.readyState >= 2) {
        computeFrame(); // Start processing if enabled
    }
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    resize();
});

// Resize canvas when viewport is resized
window.addEventListener('resize', () => {
    resize();
});

function resize() {
    viewWidth = window.innerWidth;
    viewHeight = (viewWidth / 16) * 9;
    ogCanvas.setAttribute('width', viewWidth);
    ogCanvas.setAttribute('height', viewHeight);
    temp.setAttribute('width', viewWidth);
    temp.setAttribute('height', viewHeight);
    video.setAttribute('width', viewWidth);
    video.setAttribute('height', viewHeight);
}

function convolve(matrix, divisor, offset) {
    let olddata = frame;
    let oldpx = olddata.data;
    let newdata = context.createImageData(olddata);
    let newpx = newdata.data;
    let len = newpx.length;
    let res = 0;
    let w = frame.width;

    for (let i = 0; i < len; i++) {
        if ((i + 1) % 4 === 0) {
            newpx[i] = oldpx[i];
            continue;
        }
        res = 0;
        let these = [
            oldpx[i - w * 4 - 4] || oldpx[i],
            oldpx[i - w * 4] || oldpx[i],
            oldpx[i - w * 4 + 4] || oldpx[i],
            oldpx[i - 4] || oldpx[i],
            oldpx[i],
            oldpx[i + 4] || oldpx[i],
            oldpx[i + w * 4 - 4] || oldpx[i],
            oldpx[i + w * 4] || oldpx[i],
            oldpx[i + w * 4 + 4] || oldpx[i],
        ];
        for (let j = 0; j < 9; j++) {
            res += these[j] * matrix[j];
        }
        res /= divisor;
        if (offset) {
            res += offset;
        }
        newpx[i] = res;
    }
    return newdata;
}