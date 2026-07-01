const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const cors = require('cors');
const app = express();

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function checkPath(path) {
	try {
		const stats = await fs.stat(path);
		return {
			ok: true,
			exists: true,
			isDirectory: stats.isDirectory(),
			isFile: stats.isFile(),
			message: "Path is valid.",
		}
	} catch (err) {
		if (err.code == "ENOENT") {
			return {
				ok: false,
				exists: false,
				message: "Path does not exist.",
			}
		}
		return {
			ok: false,
			exists: false,
			message: err.message,
		};
	}
}

async function readDirectory(dirPath) {
	const pathInfo = await checkPath(dirPath);

	if (!pathInfo.ok) {
		return pathInfo;
	}

	if (!pathInfo.isDirectory) {
		return {
			ok: false,
			message: "The given path is not a directory."
		}
	}
	const children = [];

	const files = await fs.readdir(dirPath);

	for (const file of files) {
		const fullPath = path.join(dirPath, file);
		const stats = await fs.stat(fullPath);
		if (stats.isDirectory()) {
			children.push({
				name: file,
				type: "directory",
				children: await readDirectory(fullPath),
			});
		} else {
			children.push({
				name: file,
				type: "file",
				size: stats.size,
				modified: stats.mtime,
			});
		}
	}

	return {
		ok: true,
		message: "Directory read successfully.",
		children,
	}
}

app.get('/read_directories', async (req, res) => {
	const dirPath = req.query.path || "C:/Users/zzsdr/Desktop/my-react-app";
	console.log("dirPath -> ", dirPath);

	try {
		const results = await readDirectory(dirPath);
		if (!results.ok) {
			return res.status(400).json({
				success: false,
				message: results.message,
			});
		}
		return res.status(200).json({
			success: true,
			dirPath: dirPath,
			tree: results.children,
			fall_back_server: true,
		})
	}
	catch (err) {
		return res.status(404).json({
			success: false,
			message: err.message,
		});
		console.error(err);
	}
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});