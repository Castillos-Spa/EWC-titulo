/// <reference types="cypress" />

import { ticketsFixture, usersFixture } from "../support/testData";

describe("Tickets module", () => {
  beforeEach(() => {
    cy.stubDashboardOverview();
    cy.loginAsStubAdmin();
    cy.contains("Panel principal", { timeout: 20000 }).should("be.visible");
  });

  it("loads ticket data and renders the table view", () => {
    cy.intercept("GET", "**/tickets", {
      statusCode: 200,
      body: ticketsFixture,
    }).as("getTickets");
    cy.intercept("GET", "**/users", {
      statusCode: 200,
      body: usersFixture,
    }).as("getUsers");

    cy.get("nav").contains("Sistema de Tickets").click();

    cy.wait(["@getTickets", "@getUsers"]);
    cy.location("pathname").should("eq", "/tickets");

    cy.contains("Seguimiento centralizado de tickets corporativos").should(
      "be.visible"
    );
    cy.contains("#9001").should("be.visible");
    cy.contains("Corte de VPN afecta despacho").should("be.visible");
    cy.contains("Urgente").should("be.visible");
    cy.contains("Resuelto").should("be.visible");
  });
});
