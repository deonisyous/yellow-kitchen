import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

const SUPPORTED_WEBP_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

const ensureDir = async (dirPath) => {
	await fs.promises.mkdir(dirPath, { recursive: true });
};

const walkFiles = async (dirPath) => {
	if (!fs.existsSync(dirPath)) {
		return [];
	}

	const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);

		if (entry.isDirectory()) {
			files.push(...(await walkFiles(fullPath)));
			continue;
		}

		files.push(fullPath);
	}

	return files;
};

const isInsideDirectory = (filePath, directoryPath) => {
	const relativePath = path.relative(directoryPath, filePath);
	return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
};

export const canGenerateWebp = () => Boolean(sharp);

export const generateWebpImages = async ({ srcRoot, destRoot, exclude = [], quality = 85 }) => {
	const sourceRoot = path.resolve(srcRoot);
	const destinationRoot = path.resolve(destRoot);
	const excludedDirectories = exclude.map((entry) => path.resolve(entry));

	const allFiles = await walkFiles(sourceRoot);
	const files = allFiles.filter((filePath) => {
		const extension = path.extname(filePath).toLowerCase();

		if (!SUPPORTED_WEBP_EXTENSIONS.has(extension)) {
			return false;
		}

		return !excludedDirectories.some(
			(directoryPath) =>
				isInsideDirectory(filePath, directoryPath) || filePath === directoryPath
		);
	});

	await Promise.all(
		files.map(async (filePath) => {
			const relativePath = path.relative(sourceRoot, filePath);
			const outputPath = path
				.join(destinationRoot, relativePath)
				.replace(/\.[^.]+$/, '.webp');

			if (
				fs.existsSync(outputPath) &&
				fs.statSync(outputPath).mtimeMs >= fs.statSync(filePath).mtimeMs
			) {
				return;
			}

			await ensureDir(path.dirname(outputPath));
			await sharp(filePath).webp({ quality }).toFile(outputPath);
		})
	);
};
