/// <reference types="cypress" />

import { stubAdminUser } from "../support/testData";

describe("Dashboard overview", () => {
  beforeEach(() => {
    cy.stubDashboardOverview();

    let isAuthenticated = false;

    cy.intercept("GET", "**/auth/profile*", (req) => {
      if (!isAuthenticated) {
        req.reply({ statusCode: 401, body: { message: "Unauthorized" } });
        return;
      }
      req.reply({ statusCode: 200, body: stubAdminUser });
    }).as("profileRequest");

    cy.intercept("POST", "**/auth/login*", (req) => {
      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      expect(payload).to.include({
        email: "demo.admin@example.com",
        password: "DemoPassword!23",
      });

      isAuthenticated = true;

      req.reply({
        statusCode: 200,
        body: {
          access_token: "stub-access-token",
          refresh_token: "stub-refresh-token",
          user: stubAdminUser,
        },
      });
    }).as("loginRequest");

    cy.visit("/login");

    cy.get('[data-cy="login-email"]', { timeout: 15000 })
      .should("be.visible")
      .clear()
      .type("demo.admin@example.com");

    cy.get('[data-cy="login-password"]', { timeout: 15000 })
      .should("be.visible")
      .clear()
      .type("DemoPassword!23", { log: false });

    cy.get('[data-cy="login-submit"]').click();

    cy.wait("@loginRequest", { timeout: 20000 })
      .its("response.statusCode")
      .should("eq", 200);

    cy.location("pathname", { timeout: 20000 }).should("eq", "/");
  });

  it("displays module highlights for the admin user", () => {
    cy.contains("Visión General", { timeout: 20000 })
      .scrollIntoView()
      .should("be.visible");
    cy.contains("Operaciones de Transporte")
      .scrollIntoView()
      .should("be.visible");
    cy.contains("Mantenimiento y Taller").scrollIntoView().should("be.visible");
    cy.contains("Servicios de Aseo").scrollIntoView().should("be.visible");
    cy.contains("Obras Civiles").scrollIntoView().should("be.visible");
    cy.contains("Mesa de Ayuda y Tickets")
      .scrollIntoView()
      .should("be.visible");

    cy.contains("Vehículos").scrollIntoView().should("be.visible");
    cy.contains("Disponibilidad de flota")
      .scrollIntoView()
      .should("be.visible");
    cy.contains("Conductores activos").scrollIntoView().should("be.visible");
    cy.contains("OT completadas").scrollIntoView().should("be.visible");
    cy.contains("Sectores cubiertos").scrollIntoView().should("be.visible");
    cy.contains("Proyectos activos").scrollIntoView().should("be.visible");
    cy.contains("Tickets abiertos").scrollIntoView().should("be.visible");
  });
});
