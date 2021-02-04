module.exports = {
    extends: ['stylelint-config-standard'<% if (linter.includes('prettier')) { %>, 'stylelint-prettier/recommended'<% } %>],

    plugins: [<% if (linter.includes('prettier')) { %>'stylelint-prettier', <% } %>'stylelint-scss'],

    rules: {
        'at-rule-no-unknown': null,
        'scss/at-rule-no-unknown': true,
    },
};
