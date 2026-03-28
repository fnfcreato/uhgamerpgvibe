export class PixelText {
    static draw(ctx, text, x, y, options = {}) {
        const {
            color = '#fff',
            align = 'left',
            baseline = 'top',
            size = 8,
            weight = 'normal',
            alpha = 1,
        } = options;

        ctx.save();
        ctx.fillStyle = color;
        ctx.font = `${weight} ${size}px monospace`;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.globalAlpha = alpha;
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    static measure(ctx, text, options = {}) {
        const { size = 8, weight = 'normal' } = options;
        ctx.save();
        ctx.font = `${weight} ${size}px monospace`;
        const width = ctx.measureText(text).width;
        ctx.restore();
        return width;
    }

    static fitText(ctx, text, maxWidth, options = {}) {
        if (maxWidth <= 0) {
            return '';
        }
        if (this.measure(ctx, text, options) <= maxWidth) {
            return text;
        }

        const ellipsis = '...';
        let trimmed = text;
        while (trimmed.length > 0 && this.measure(ctx, `${trimmed}${ellipsis}`, options) > maxWidth) {
            trimmed = trimmed.slice(0, -1);
        }
        return trimmed.length > 0 ? `${trimmed}${ellipsis}` : ellipsis;
    }

    static wrapText(ctx, text, maxWidth, options = {}) {
        if (!text) {
            return [''];
        }
        if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
            return [text];
        }

        const lines = [];
        const paragraphs = String(text).split('\n');

        for (const paragraph of paragraphs) {
            const words = paragraph.split(/\s+/).filter(Boolean);
            if (words.length === 0) {
                lines.push('');
                continue;
            }

            let currentLine = '';
            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (this.measure(ctx, testLine, options) <= maxWidth) {
                    currentLine = testLine;
                    continue;
                }

                if (currentLine) {
                    lines.push(currentLine);
                }

                if (this.measure(ctx, word, options) <= maxWidth) {
                    currentLine = word;
                    continue;
                }

                let remainder = word;
                while (remainder.length > 0) {
                    let chunk = remainder[0];
                    while (
                        chunk.length < remainder.length
                        && this.measure(ctx, `${chunk}${remainder[chunk.length]}`, options) <= maxWidth
                    ) {
                        chunk += remainder[chunk.length];
                    }
                    lines.push(chunk);
                    remainder = remainder.slice(chunk.length);
                }
                currentLine = '';
            }

            if (currentLine) {
                lines.push(currentLine);
            }
        }

        return lines;
    }

    static drawParagraph(ctx, text, x, y, options = {}) {
        const {
            maxWidth = Infinity,
            lineHeight = (options.size || 8) + 2,
            maxLines = Infinity,
            ...drawOptions
        } = options;

        let lines = this.wrapText(ctx, text, maxWidth, drawOptions);
        if (lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            const lastIndex = lines.length - 1;
            lines[lastIndex] = this.fitText(ctx, lines[lastIndex], maxWidth, drawOptions);
        }

        for (let i = 0; i < lines.length; i++) {
            this.draw(ctx, lines[i], x, y + i * lineHeight, drawOptions);
        }

        return lines.length;
    }
}
