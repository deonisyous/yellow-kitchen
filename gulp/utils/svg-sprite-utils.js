import fs from 'node:fs';
import path from 'node:path';

import fg from 'fast-glob';
import { optimize } from 'svgo';

const getAttribute = (svg, attributeName) => {
	const match = svg.match(new RegExp(`\\s${attributeName}=(["'])(.*?)\\1`, 'i'));
	return match?.[2] || '';
};

const getSvgContent = (svg) =>
	svg
		.replace(/<\?xml[\s\S]*?\?>/gi, '')
		.replace(/<!doctype[\s\S]*?>/gi, '')
		.replace(/<\/?svg[^>]*>/gi, '')
		.trim();

const getSymbolId = (filePath) =>
	path
		.parse(filePath)
		.name.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '');

const ensureDir = async (dirPath) => {
	await fs.promises.mkdir(dirPath, { recursive: true });
};

export async function buildSvgSprite({ src, destFile, removePaintAttrs = true }) {
	const files = await fg(src, { onlyFiles: true });

	if (files.length === 0) {
		return;
	}

	const symbols = await Promise.all(
		files
			.sort((a, b) => a.localeCompare(b))
			.map(async (filePath) => {
				const source = await fs.promises.readFile(filePath, 'utf8');
				const optimized = optimize(source, {
					path: filePath,
					multipass: true,
					plugins: [
						{
							name: 'preset-default',
							params: {
								overrides: {
									removeViewBox: false,
								},
							},
						},
						...(removePaintAttrs
							? [
									{
										name: 'removeAttrs',
										params: {
											attrs: '(fill|stroke)',
										},
									},
								]
							: []),
					],
				}).data;

				const viewBox = getAttribute(optimized, 'viewBox');
				const symbolAttrs = viewBox ? ` viewBox="${viewBox}"` : '';

				return `\t<symbol id="${getSymbolId(filePath)}"${symbolAttrs}>\n\t\t${getSvgContent(optimized)}\n\t</symbol>`;
			})
	);

	await ensureDir(path.dirname(destFile));
	await fs.promises.writeFile(
		destFile,
		`<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n${symbols.join('\n')}\n</svg>\n`,
		'utf8'
	);
}
