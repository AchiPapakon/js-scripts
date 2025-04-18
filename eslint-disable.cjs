const fs = require('fs');
const { ESLint } = require('eslint');

const parseFixes = async () => {
    const eslint = new ESLint({ fix: false });
    const results = await eslint.lintFiles(['src/**/*.js']);

    results.forEach(result => {
        fs.readFile(result.filePath, 'utf8', (err, fileContents) => {
            if (err) {
                throw err;
            }

            const lines = fileContents.split('\n');
            const lengthBefore = lines.length;
            let lengthAfter = -1;

            result.messages.forEach(message => {
                // console.log(message.message);
                if (message.message === 'Unexpected unnamed generator function.') {
                    const { line } = message;

                    lines.splice(line - 1, 0, '// eslint-disable-next-line func-names');
                    lengthAfter = lines.length;

                    console.log(result.filePath);
                }
            });

            if (lengthAfter > lengthBefore) {
                fs.writeFile(result.filePath, lines.join('\n'), writeFileError => {
                    if (writeFileError) {
                        throw writeFileError;
                    }
                });
            }
        });
    });
};

parseFixes();
