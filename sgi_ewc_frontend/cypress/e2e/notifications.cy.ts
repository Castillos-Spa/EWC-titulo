/// <reference types="cypress" />

import { notificationsFixture } from "../support/testData";

describe("Notifications module", () => {
  beforeEach(() => {
    cy.stubDashboardOverview();
    cy.loginAsStubAdmin();
    cy.contains("Panel principal", { timeout: 20000 }).should("be.visible");
  });

  it("lists notifications returned by the API", () => {
    cy.intercept("GET", "**/notification", {
      statusCode: 200,
      body: notificationsFixture,
    }).as("getNotifications");

    cy.get("nav").contains("Notificaciones").click();

    cy.wait("@getNotifications");
    cy.location("pathname").should("eq", "/notificaciones");

    cy.contains("Centro corporativo de avisos").should("be.visible");
    cy.contains("Alerta de combustible").should("be.visible");
    cy.contains("Nivel de combustible bajo en flota norte").should(
      "be.visible"
    );
  });
});
