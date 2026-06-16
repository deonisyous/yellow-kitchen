import fs from 'node:fs';
import path from 'node:path';

import wawoff2 from 'wawoff2';

const FONT_WEIGHT_MAP = {
	thin: 100,
	hairline: 100,
	extralight: 200,
	ultralight: 200,
	light: 300,
	regular: 400,
	book: 400,
	normal: 400,
	medium: 500,
	semibold: 600,
	demibold: 600,
	bold: 700,
	extrabold: 800,
	ultrabold: 800,
	heavy: 800,
	black: 900,
};

const FONT_FORMATS = {
	woff2: 'woff2',
	woff: 'woff',
};

const formatFontFamily = (fontName) => (/[\s"']/.test(fontName) ? `'${fontName}'` : fontName);

const ensureDir = async (dirPath) => {
	await fs.promises.mkdir(dirPath, { recursive: true });
};

function getFontMeta(fontFileName) {
	const [rawFontName, ...rawVariantParts] = fontFileName.split('-');
	const rawVariant = rawVariantParts.join('-') || 'Regular';
	const normalizedVariant = rawVariant.replace(/[_\s-]+/g, '').toLowerCase();
	const fontStyle =
		normalizedVariant.includes('italic') || normalizedVariant.includes('oblique')
			? 'italic'
			: 'normal';

	let fontWeight = 400;
	for (const [key, value] of Object.entries(FONT_WEIGHT_MAP)) {
		if (normalizedVariant.includes(key)) {
			fontWeight = value;
			break;
		}
	}

	return {
		fontName: rawFontName || fontFileName,
		fontWeight,
		fontStyle,
	};
}

export async function prepareFontFiles({ srcDir, destDir }) {
	if (!fs.existsSync(srcDir)) {
		return;
	}

	await ensureDir(destDir);

	const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
	const fontFiles = entries.filter((entry) => entry.isFile());

	for (const entry of fontFiles) {
		const extension = path.extname(entry.name).toLowerCase();
		const sourcePath = path.join(srcDir, entry.name);
		const parsed = path.parse(entry.name);

		if (extension === '.ttf') {
			const sourceBuffer = await fs.promises.readFile(sourcePath);
			const outputBuffer = Buffer.from(await wawoff2.compress(sourceBuffer));
			await fs.promises.writeFile(path.join(destDir, `${parsed.name}.woff2`), outputBuffer);
			continue;
		}

		if (extension === '.woff' || extension === '.woff2') {
			await fs.promises.copyFile(sourcePath, path.join(destDir, entry.name));
		}
	}
}

export function buildFontStyles(fontsDir) {
	if (!fs.existsSync(fontsDir)) {
		return '';
	}

	const fontEntries = new Map();

	for (const fileName of fs.readdirSync(fontsDir)) {
		const extension = path.extname(fileName).slice(1).toLowerCase();

		if (!Object.hasOwn(FONT_FORMATS, extension)) {
			continue;
		}

		const fontFileName = path.parse(fileName).name;
		const formats = fontEntries.get(fontFileName) || new Set();
		formats.add(extension);
		fontEntries.set(fontFileName, formats);
	}

	return [...fontEntries.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([fontFileName, formats]) => {
			const { fontName, fontWeight, fontStyle } = getFontMeta(fontFileName);
			const fontFamily = formatFontFamily(fontName);
			const sources = ['woff2', 'woff']
				.filter((format) => formats.has(format))
				.map(
					(format) =>
						`url('../fonts/${fontFileName}.${format}') format('${FONT_FORMATS[format]}')`
				)
				.join(', ');

			return `@font-face {\n\tfont-family: ${fontFamily};\n\tfont-display: swap;\n\tsrc: ${sources};\n\tfont-weight: ${fontWeight};\n\tfont-style: ${fontStyle};\n}\n`;
		})
		.join('\n');
}
