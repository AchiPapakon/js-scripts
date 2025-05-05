#!/usr/bin/env node
/**
 * This script scans the "src" directory and its subdirectories for JavaScript files.
 * Each variable or function declared is stored in a list.
 * Then, we check the JavaScript files if they contain each item in the list at least twice.
 * If not, we store the items that appear only once in the file "deadCode.txt"
 */
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const startTime = Date.now();

const getAllJsFiles = (dirPath, arrayOfFiles = []) => {
    const files = fs.readdirSync(dirPath);

    let arrayOfFilesClone = [...arrayOfFiles];

    files.forEach(file => {
        if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
            arrayOfFilesClone = getAllJsFiles(`${dirPath}/${file}`, arrayOfFilesClone);
        } else {
            const m = file.match(/\.(\w+)$/);
            if (m && m[1] === 'js') {
                arrayOfFilesClone.push(path.join(dirPath, '/', file));
            }
        }
    });
    return arrayOfFilesClone;
};

// The array of all the JavaScript files
const arrayOfJsFiles = getAllJsFiles(path.join(__dirname, '../src'));
console.log('Number of js files:', arrayOfJsFiles.length);
// console.log('Files:', arrayOfJsFiles);

// The array of all the functions or variables
const allVariablesAndFunctions = new Set();

// The array of all the functions or variables which are never called
// const deadList = [];
const votingList = {};

const allVariablesAndFunctionsPromises = [];
// Loop the js files and extract the functions/variables
arrayOfJsFiles.forEach(jsFile => {
    allVariablesAndFunctionsPromises.push(
        new Promise(resolve => {
            const readInterface = readline.createInterface({
                input: fs.createReadStream(jsFile),
                // output: process.stdout,
                console: false,
            });

            readInterface.on('line', line => {
                const m = line.match(/^(?:export )*(?:const|function\**) (\w+)/);
                if (m) {
                    // console.log(m[1]);
                    allVariablesAndFunctions.add(m[1]);
                }
            });

            readInterface.on('close', () => {
                resolve();
            });
        })
    );
});

Promise.all(allVariablesAndFunctionsPromises).then(() => {
    console.log('All variables and functions:', allVariablesAndFunctions.size);
    process.stdout.write('Reading the files...\n');

    // Loop the js files and search for at least 2 occurrences (one plus one)
    const votingListPromises = [];
    arrayOfJsFiles.forEach(jsFile => {
        votingListPromises.push(
            new Promise(resolve => {
                fs.readFile(jsFile, 'utf8', (err, data) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    allVariablesAndFunctions.forEach(variableOrFunction => {
                        const m = data.match(new RegExp(`\\b${variableOrFunction}\\b`, 'g'));
                        if (m) {
                            process.stdout.clearLine();
                            process.stdout.cursorTo(0);
                            process.stdout.write(`${jsFile}...`);
                            votingList[variableOrFunction] = (votingList[variableOrFunction] || 0) + m.length;
                            if (votingList[variableOrFunction] > 1) {
                                allVariablesAndFunctions.delete(variableOrFunction);
                            }
                        }
                    });
                    resolve();
                });
            })
        );
    });

    Promise.all(votingListPromises).then(() => {
        // console.log('Voting list:', votingList);

        // Final dead code list
        const deadList = Object.entries(votingList).reduce((list, pair) => {
            if (pair[1] === 1) {
                list.push(pair[0]);
                return list;
            }
            return list;
        }, []);

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write('Done!\n');
        console.log('Total number of dead variables or functions:', deadList.length);

        const endTime = Date.now();
        console.log('Total time:', endTime - startTime, 'ms');

        fs.writeFile(path.join(__dirname, '../deadCode.txt'), deadList.join('\n'), err => {
            if (err) {
                console.error(err);
            }
            console.log("File 'deadCode' created successfully!");
        });
    });
});
