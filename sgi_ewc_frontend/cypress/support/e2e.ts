/// <reference types="cypress" />

import "./commands";

beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});
