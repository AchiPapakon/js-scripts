const fs = require('fs');
const readline = require('readline');
const path = require('path');

const renamePromises = [];

const rename = jsFile => {
    renamePromises.push(
        new Promise(resolve => {
            const readInterface = readline.createInterface({
                input: fs.createReadStream(jsFile),
                console: false,
            });

            readInterface.on('line', line => {
                const m = line.match(/import React.* from 'react'/);
                if (m) {
                    fs.rename(jsFile, jsFile.replace(/(\.)\w+$/, '$1jsx'), err => {
                        if (err) {
                            throw err;
                        }
                    });
                }
            });

            readInterface.on('close', () => {
                resolve();
            });
        })
    );
};

const traverseFiles = dirPath => {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
            traverseFiles(path.join(dirPath, file));
        } else {
            const m = file.match(/\.(\w+)$/);
            if (m && m[1] === 'js') {
                // Rename
                rename(path.join(dirPath, file));
            }
        }
    });
};

traverseFiles(path.join(__dirname, '../src'));

Promise.all(renamePromises).then(() => {
    console.log('Done');
});
