/* eslint-disable no-console */
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const renamePromises = [];

let count = 0;

const rename = (jsFile, { preview = false }) => {
    renamePromises.push(
        new Promise(resolve => {
            let data = '';
            const previewLines = [];

            const readInterface = readline.createInterface({
                input: fs.createReadStream(jsFile),
                console: false,
            });

            readInterface.on('line', line => {
                const newLine = line
                    .replace(/(from '|")(apis\/.+)/, '$1src/$2')
                    .replace(/(from '|")(components\/.+)/, '$1src/$2')
                    .replace(/(from '|")(constants\/.+)/, '$1src/$2')
                    .replace(/(from '|")(containers\/.+)/, '$1src/$2')
                    .replace(/(from '|")(helpers\/.+)/, '$1src/$2')
                    .replace(/(from '|")(hooks\/.+)/, '$1src/$2')
                    .replace(/(from '|")(mocks\/.+)/, '$1src/$2')
                    .replace(/(from '|")(redux\/.+)/, '$1src/$2')
                    .replace(/(from '|")(resources\/.+)/, '$1src/$2')
                    .replace(/(from '|")(selectors\/.+)/, '$1src/$2')
                    .replace(/(from '|")(css\/.+)/, '$1src/$2');
                if (preview) {
                    if (newLine !== line) {
                        previewLines.push(line);
                        previewLines.push(newLine);
                    }
                }

                data += `${data ? '\n' : ''}${newLine || ''}`;

                if (newLine !== line) {
                    count += 1;
                }
            });

            readInterface.on('close', () => {
                if (!preview) {
                    data += '\n';
                    fs.writeFile(jsFile, data || '', 'utf8', err => {
                        if (err) {
                            console.log('Error in file:', jsFile);
                            console.log(`data: >${data}<`);
                            throw new Error(err);
                        }
                    });
                }
                resolve(previewLines.length > 0 ? previewLines.join('\n') : null);
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
            if (m && m[1].match(/jsx?/)) {
                // Rename
                rename(path.join(dirPath, file), { preview: false });
            }
        }
    });
};

traverseFiles(path.join(__dirname, '../src'));

Promise.all(renamePromises).then(a => {
    console.log(a.filter(Boolean).join('\n'));
    console.log('Done:', count);
});
