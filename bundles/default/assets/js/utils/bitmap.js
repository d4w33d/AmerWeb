
export function createTextBadgeImage(text, drawingColor, flipArrow = false) {
    const fontSize = 9;
    const font = "bold " + fontSize + "px sans-serif";
    const paddingH = 7;
    const paddingV = 5;
    const height = 20;
    const arrowWidth = 5;
    const arrowH = 5;
    const r = 5;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    const metrics = ctx.measureText(text);

    const textWidth = Math.ceil(metrics.width);
    const rectWidth = textWidth + paddingH * 2;
    const totalWidth = rectWidth + arrowWidth;

    canvas.width = totalWidth;
    canvas.height = height;

    ctx.font = font;
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    const midY = height / 2;

    if (!flipArrow) {
        ctx.moveTo(r, 0);
        ctx.lineTo(rectWidth - r, 0);
        ctx.quadraticCurveTo(rectWidth, 0, rectWidth, r);
        ctx.lineTo(rectWidth, midY - arrowH);
        ctx.lineTo(rectWidth + arrowWidth, midY);
        ctx.lineTo(rectWidth, midY + arrowH);
        ctx.lineTo(rectWidth, height - r);
        ctx.quadraticCurveTo(rectWidth, height, rectWidth - r, height);
        ctx.lineTo(r, height);
        ctx.quadraticCurveTo(0, height, 0, height - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
    } else {
        ctx.moveTo(arrowWidth + r, 0);
        ctx.lineTo(totalWidth - r, 0);
        ctx.quadraticCurveTo(totalWidth, 0, totalWidth, r);
        ctx.lineTo(totalWidth, height - r);
        ctx.quadraticCurveTo(totalWidth, height, totalWidth - r, height);
        ctx.lineTo(arrowWidth + r, height);
        ctx.quadraticCurveTo(arrowWidth, height, arrowWidth, height - r);
        ctx.lineTo(arrowWidth, midY + arrowH);
        ctx.lineTo(0, midY);
        ctx.lineTo(arrowWidth, midY - arrowH);
        ctx.lineTo(arrowWidth, r);
        ctx.quadraticCurveTo(arrowWidth, 0, arrowWidth + r, 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = drawingColor;
    const textX = flipArrow ? arrowWidth + paddingH : paddingH;
    ctx.fillText(text, textX, midY + 1);

    return ctx.getImageData(0, 0, totalWidth, height);
}

export function createLabelBitmapImage(text) {
    const fontSize = 9;
    const paddingH = 8;
    const paddingV = 6;
    const font = "bold " + fontSize + "px sans-serif";

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    const metrics = ctx.measureText(text);

    const textWidth = Math.ceil(metrics.width);
    const height = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + paddingV * 2) || 42;
    const width = textWidth + paddingH * 2;

    canvas.width = width + 8;
    canvas.height = height + 8;

    ctx.font = font;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;

    const r = 5;
    const m = 4;
    ctx.beginPath();
    ctx.roundRect(m, m, width, height, r);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, m + paddingH, (m + height / 2) + 1);

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
