module.exports = {
    extends: ['airbnb-base'<% if (linter.includes('prettier')) { %>, 'prettier', 'plugin:prettier/recommended'<% } %>],<% if (linter.includes('prettier')) { %>

    plugins: ['prettier'],<% } %>
};
