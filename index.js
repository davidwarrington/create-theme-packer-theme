#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const consola = require('consola');
const sao = require('sao');
const yargs = require('yargs');

(() => {
    const { argv } = yargs;
    const [outDir = '.', repo] = argv._;
    const outDirFiles = fs.existsSync(outDir) ? fs.readdirSync(outDir) : [];

    if (outDirFiles.length > 0) {
        consola.error(
            new Error(
                `Provided output directory (${outDir}) already exists and is not empty. Aborting.`
            )
        );
        return;
    }

    const generator = repo || path.resolve(__dirname);

    sao({
        generator,
        logLevel: 2,
        outDir,
    })
        .run()
        .catch(sao.handleError);
})();
