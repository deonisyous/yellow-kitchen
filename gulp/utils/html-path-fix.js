import through from 'through2';
import path from 'node:path';

export function fixHtmlPaths() {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			return cb(null, file);
		}

		let content = file.contents.toString();

		// Calculate depth based on file.relative path
		// e.g., "index.html" -> depth 0
		// "pages/about.html" -> depth 1
		const depth = file.relative.split(/[/\\]/).length - 1;
		const prefix = depth === 0 ? './' : '../'.repeat(depth);

		content = content.replace(
			/(?<=src=|href=|srcset=)(['"])(\.(\.)?\/)*(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^/'"]+(\/))?([^'"]*)\1/gi,
			`$1${prefix}$4$5$7$1`
		);

		file.contents = Buffer.from(content);
		cb(null, file);
	});
}
