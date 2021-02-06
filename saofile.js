const path = require('path');
const hostedGitInfo = require('hosted-git-info');
const copyEnvFile = require('./utils/copy-env-file');

module.exports = {
    prompts() {
        return [
            {
                name: 'name',
                message: 'What is the name of your new project?',
                default: this.outFolder,
            },
            {
                name: 'store',
                message: 'What is the myshopify url of your store?',
                default({ name }) {
                    return `${name}.myshopify.com`;
                },
            },
            {
                name: 'author',
                message: 'Who is authoring the project?',
                default: this.gitUser.username || this.gitUser.name,
                store: true,
            },
            {
                name: 'repo',
                message: 'Where is your git repo located?',
                default({ author, name }) {
                    if (author && name) {
                        return `git@github.com:${author}/${name}`;
                    }

                    return '';
                },
            },
            {
                name: 'documentationUrl',
                message: 'Where can documentation for this theme be found?',
                default({ repo }) {
                    const gitInfo = hostedGitInfo.fromUrl(repo);
                    if (!gitInfo) {
                        return '';
                    }

                    return gitInfo.https({ noGitPlus: true });
                },
            },
            {
                name: 'supportUrl',
                message: 'Where can support for this theme be found?',
                default({ repo }) {
                    const gitInfo = hostedGitInfo.fromUrl(repo);
                    if (!gitInfo) {
                        return '';
                    }

                    return gitInfo.bugs({ noGitPlus: true });
                },
            },
            {
                name: 'linter',
                message: 'Which linters would you like to use?',
                type: 'checkbox',
                choices: [
                    { name: 'ESLint', value: 'eslint' },
                    { name: 'Prettier', value: 'prettier' },
                    { name: 'Stylelint', value: 'stylelint' },
                ],
            },
            {
                name: 'testFramework',
                message: 'Which testing frameworks would you like to use?',
                type: 'checkbox',
                choices: [
                    { name: 'Cypress', value: 'cypress' },
                    { name: 'Jest', value: 'jest' },
                ],
            },
        ];
    },
    templateData() {
        const hasTestFramework = this.answers.testFramework.length >= 0;
        const runCommand = this.npmClient === 'yarn' ? 'yarn' : 'npm run';

        return {
            hasTestFramework,
            runCommand,
        };
    },
    actions() {
        const generator = this;

        const actions = [
            {
                files: '**',
                templateDir: 'template',
                type: 'add',
                filters: {
                    '.eslintignore': `linter.includes('eslint')`,
                    '.eslintrc.js': `linter.includes('eslint')`,
                    '.prettierrc.js': `linter.includes('prettier')`,
                    'cypress.env.example.json': `testFramework.includes('cypress')`,
                    'cypress.json': `testFramework.includes('cypress')`,
                    'jest.config.js': `testFramework.includes('jest')`,
                },
            },
        ];

        actions.push({
            type: 'move',
            patterns: {
                gitignore: '.gitignore',
            },
        });

        if (generator.answers.testFramework.length === 0) {
            actions.push({
                files: 'tests',
                type: 'remove',
            });
        } else {
            if (!generator.answers.linter.includes('eslint')) {
                actions.push({
                    files: 'tests/**/.eslintrc.js',
                    type: 'remove',
                });
            }

            if (!generator.answers.testFramework.includes('cypress')) {
                actions.push({
                    files: 'tests/e2e',
                    type: 'remove',
                });
            }

            if (!generator.answers.testFramework.includes('jest')) {
                actions.push({
                    files: 'tests/unit',
                    type: 'remove',
                });
            }
        }

        actions.push({
            files: 'package.json',
            type: 'modify',
            handler(data) {
                const pkg = { ...data };
                const linters = {
                    eslint: generator.answers.linter.includes('eslint'),
                    prettier: generator.answers.linter.includes('prettier'),
                    stylelint: generator.answers.linter.includes('stylelint'),
                };
                const testFrameworks = {
                    cypress: generator.answers.testFramework.includes(
                        'cypress'
                    ),
                    jest: generator.answers.testFramework.includes('jest'),
                };

                const { devDependencies } = { ...data };
                const devDependencyEntries = Object.entries(
                    devDependencies
                ).filter(([name]) => {
                    let shouldStay = true;

                    Object.entries(linters).forEach(([linter, hasLinter]) => {
                        if (name.startsWith(linter) && !hasLinter) {
                            shouldStay = false;
                        }
                    });

                    if (
                        [
                            'eslint-config-prettier',
                            'eslint-plugin-prettier',
                            'stylelint-config-prettier',
                            'stylelint-prettier',
                        ].includes(name) &&
                        !linters.prettier
                    ) {
                        shouldStay = false;
                    }

                    Object.entries(testFrameworks).forEach(
                        ([testFramework, hasTestFrameworks]) => {
                            if (
                                name.startsWith(testFramework) &&
                                !hasTestFrameworks
                            ) {
                                shouldStay = false;
                            }
                        }
                    );

                    if (
                        name === 'eslint-plugin-cypress' &&
                        !testFrameworks.cypress
                    ) {
                        shouldStay = false;
                    }

                    if (name === 'eslint-plugin-jest' && !testFrameworks.jest) {
                        shouldStay = false;
                    }

                    return shouldStay;
                });

                pkg.devDependencies = Object.fromEntries(devDependencyEntries);

                [
                    ['author', 'author'],
                    ['repo', 'repository'],
                    ['supportUrl', 'bugs'],
                ].forEach(([answerKey, packageKey]) => {
                    if (!generator.answers[answerKey]) {
                        delete pkg[packageKey];
                    }
                });

                const possibleLintScripts = ['lint:css', 'lint:js'];
                const usedLintScripts = [];
                ['stylelint', 'eslint'].forEach((linter, index) => {
                    const script = possibleLintScripts[index];
                    if (!generator.answers.linter.includes(linter)) {
                        delete pkg.scripts[script];
                    } else {
                        usedLintScripts.push(script);
                    }
                });

                const runCommand =
                    generator.npmClient === 'yarn' ? 'yarn' : 'npm run';
                pkg.scripts.lint = usedLintScripts
                    .map(script => `${runCommand} ${script}`)
                    .join(' && ');

                if (!testFrameworks.cypress) {
                    delete pkg.scripts['test:e2e'];
                }

                if (!testFrameworks.jest) {
                    delete pkg.scripts['test:unit'];
                }

                return pkg;
            },
        });

        return actions;
    },
    async completed() {
        this.gitInit();
        this.npmInstall();

        await copyEnvFile(
            path.resolve(this.outDir, '.env.example'),
            path.resolve(this.outDir, '.env'),
            this.fs
        );

        if (this.answers.testFramework.includes('cypress')) {
            await copyEnvFile(
                path.resolve(this.outDir, 'cypress.env.example.json'),
                path.resolve(this.outDir, 'cypress.env.json'),
                this.fs
            );
        }

        this.showProjectTips();
    },
};
