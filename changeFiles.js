/* eslint-disable no-console */
import fs from 'fs';
import readline from 'readline';
import path from 'path';

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonText = await readFile(path.join(__dirname, '../package.json'), 'utf8');
const data = JSON.parse(jsonText);

const { dependencies, devDependencies } = data;
const allDependencies = [...Object.keys(dependencies), ...Object.keys(devDependencies)];

const renameContentPromises = [];
const renameFileArray = [];

let filesChanged = 0;

const jsFileRegex = /(\.)js$/;

const processFile = (file) => {
    renameContentPromises.push(
        new Promise(resolve => {
            let isThisFileChanged = false;
            let data = '';

            const readInterface = readline.createInterface({
                input: fs.createReadStream(file),
                console: false,
            });

            readInterface.on('line', line => {
                const reactImport = line.match(/import (\* as )?React.* from ['"]react['"]/);
                if (reactImport) {
                    const isJsFile = file.match(jsFileRegex);
                    if (isJsFile) {
                        renameFileArray.push(file);
                    }
                }

                const newLine = line
                    .replace(/(from ['"])(apis\/.+)/, '$1src/$2')
                    .replace(/(from ['"])(components\/.+)/, '$1src/$2')
                    .replace(/(from ['"])(constants\/.+)/, '$1src/$2')
                    .replace(/(from ['"])(containers\/.+)/, '$1src/$2')
                    .replace(/(from ['"])(helpers\/.+)/, '$1src/$2')
                    .replace(/(from ['"])(hooks\/.+)/, '$1src/$2')
                    .replace(/(from ['"])(mocks\/.+)/, '$1src/$2')
                    .replace(/(from ['"])(redux\/.+)/, '$1src/$2')
                    .replace(/(from ['"])(resources\/.+)/, '$1src/$2')
                    .replace(/(from ['"])(selectors\/.+)/, '$1src/$2')
                    .replace(/(from ['"])(css\/.+)/, '$1src/$2')
                    .replace(/(from ['"])((.+)(\.js))(['"])/, (match, g1, importName, g3, g4, g5) => {
                        // Removes the '.js', but keeps it if it's the name of an installed npm package
                        if (allDependencies.includes(importName)) {
                            return match;
                        }
                        return g1 + g3 + g5;
                    })
                    .replace("import * as PropTypes from 'prop-types'", "import PropTypes from 'prop-types'");

                data += `${data ? '\n' : ''}${newLine || ''}`;

                if (!isThisFileChanged && newLine !== line) {
                    isThisFileChanged = true;
                }
            });

            readInterface.on('close', async () => {
                data += '\n';

                const actualFile = await readFile(file, 'utf8');
                if (actualFile !== data) {
                    fs.writeFile(file, data || '', 'utf8', err => {
                        if (err) {
                            console.log('Error in file:', file);
                            console.log(`data: >${data}<`);
                            throw new Error(err);
                        }
                    });

                    filesChanged += 1;
                    resolve(file);
                }
                resolve(null);
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
                processFile(path.join(dirPath, file));
            }
        }
    });
};

traverseFiles(path.join(__dirname, '../src'));

Promise.all(renameContentPromises).then(renameContentPromise => {
    if (filesChanged > 0) {
        console.log('Content changed');
        console.log('---------------');
        console.log(renameContentPromise.filter(Boolean).join('\n'));
    }

    const renameFilePromises = []

    renameFileArray.forEach(fileToBeRenamed => {
        renameFilePromises.push(new Promise(resolve => {
            const newName = fileToBeRenamed.replace(jsFileRegex, '$1jsx');
            fs.rename(fileToBeRenamed, newName, err => {
                if (err) {
                    throw err;
                }
            });

            resolve(newName);
        }));
    });

    Promise.all(renameFilePromises).then(renameFilePromise => {
        if (renameFilePromises.length > 0) {
            console.log('\nRenames');
            console.log('-------');
            console.log(renameFilePromise.filter(Boolean).join('\n'));
        }

        console.log('\nContent of files changed:', filesChanged);
        console.log('File names changed:', renameFileArray.length);
    });
});
