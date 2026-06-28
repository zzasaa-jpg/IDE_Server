const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function readDirectory(dirPath) {
	const children = [];
	const files = fs.readdirSync(dirPath);

	files.forEach(file => {
		const fullPath = path.join(dirPath, file);
		const stats = fs.statSync(fullPath);
		if (stats.isDirectory()) {
			children.push({
				name: file,
				type: "directory",
				children: readDirectory(fullPath),
			});
		} else {
			children.push({
				name: file,
				type: "file",
				size: stats.size,
				modified: stats.mtimes,
			});
		}
	});
	return children;
}

app.get('/read_directories', (req, res) => {
	const dirPath = req.query.path;
	console.log("dirPath -> ", dirPath);
	let children = [];
	try {
		const tree = readDirectory(dirPath != undefined ? dirPath : "C:/Users/zzsdr/Desktop");
		res.json({ tree, "dirParh": dirPath });
	}
	catch (err) {
		console.error(err);
	}
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});