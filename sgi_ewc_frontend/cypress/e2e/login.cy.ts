/// <reference types="cypress" />

const stubAdminUser = {
  id: 1,
  username: "demo.admin",
  email: "demo.admin@example.com",
  areas: ["Operaciones"],
  roles: ["Admin"],
  roleAssignments: [],
  rolesByArea: {},
  isAdmin: true,
  active: true,
  lastLogin: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  mustChangePassword: false,
};

describe("Login screen", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept("GET", "**/auth/profile", {
      statusCode: 401,
      body: { message: "Unauthorized" },
    }).as("profile");
  });

  it("renders login form elements", () => {
    cy.visit("/login");

    cy.contains("h2", "Inicia sesión").should("be.visible");
    cy.get('[data-cy="login-email"]').should("be.visible");
    cy.get('[data-cy="login-password"]').should("be.visible");
    cy.get('[data-cy="login-submit"]').should("be.enabled");
    cy.get('[data-cy="theme-toggle"]').should("exist");
    cy.get('[data-cy="forgot-password-link"]').should("be.visible");
  });

  it("allows a user to log in and redirects to dashboard", () => {
    cy.intercept("POST", "**/auth/login", (req) => {
      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      expect(payload).to.include({
        email: "demo.admin@example.com",
        password: "DemoPassword!23",
      });

      req.reply({
        statusCode: 200,
        body: {
          access_token: "fake-access-token",
          refresh_token: "fake-refresh-token",
          user: stubAdminUser,
        },
      });
    }).as("loginRequest");

    cy.visit("/login");

    cy.get('[data-cy="login-email"]').type("demo.admin@example.com");
    cy.get('[data-cy="login-password"]').type("DemoPassword!23");
    cy.get('[data-cy="login-submit"]').click();

    cy.wait("@loginRequest");

    cy.location("pathname", { timeout: 10000 }).should("eq", "/");

    cy.window().then((win) => {
      expect(win.localStorage.getItem("authToken")).to.equal(
        "fake-access-token"
      );
      expect(win.localStorage.getItem("refreshToken")).to.equal(
        "fake-refresh-token"
      );
    });
  });

  it("surfaces API errors when credentials are invalid", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 401,
      body: { message: "Invalid credentials" },
    }).as("loginRequest");

    cy.visit("/login");

    cy.get('[data-cy="login-email"]').type("bad.user@example.com");
    cy.get('[data-cy="login-password"]').type("BadPassword!23");
    cy.get('[data-cy="login-submit"]').click();

    cy.wait("@loginRequest");

    cy.get('[data-cy="login-error"]').should(
      "contain.text",
      "Credenciales inválidas"
    );
    cy.location("pathname").should("eq", "/login");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("authToken")).to.equal(null);
      expect(win.localStorage.getItem("refreshToken")).to.equal(null);
    });
  });
});
