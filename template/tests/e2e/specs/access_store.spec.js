describe('Shopify Store', () => {
    it('Can access the homepage', () => {
        cy.goTo('/');
        cy.url().should('contain', Cypress.config().baseUrl);
    });
});
