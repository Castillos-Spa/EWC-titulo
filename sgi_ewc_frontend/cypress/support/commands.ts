/// <reference types="cypress" />
/* eslint-disable @typescript-eslint/no-namespace */

import {
  dashboardOverviewPayload,
  notificationsFixture,
  stubAdminUser,
} from "./testData";

type LoginOptions =
  | string
  | {
      path?: string;
      email?: string;
      password?: string;
      useRealApi?: boolean;
    };

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsStubAdmin(options?: LoginOptions): Chainable<void>;
      stubDashboardOverview(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("stubDashboardOverview", () => {
  const dashboardPattern = "**/api/**/dashboard/overview*";
  const notificationPattern = "**/api/**/notification*";

  cy.intercept("OPTIONS", dashboardPattern, { statusCode: 204 });
  cy.intercept("GET", dashboardPattern, (req) => {
    req.reply({ statusCode: 200, body: dashboardOverviewPayload });
  }).as("dashboardOverview");

  cy.intercept("OPTIONS", notificationPattern, { statusCode: 204 });
  cy.intercept("GET", notificationPattern, {
    statusCode: 200,
    body: notificationsFixture,
  }).as("notificationsOverview");
});

const resolveOptions = (
  options?: LoginOptions
): Required<Exclude<LoginOptions, string>> => {
  if (typeof options === "string") {
    return {
      path: options,
      email: Cypress.env("E2E_USER_EMAIL") ?? "demo.admin@example.com",
      password: Cypress.env("E2E_USER_PASSWORD") ?? "DemoPassword!23",
      useRealApi: false,
    };
  }

  return {
    path: options?.path ?? "/",
    email:
      options?.email ??
      Cypress.env("E2E_USER_EMAIL") ??
      "demo.admin@example.com",
    password:
      options?.password ??
      Cypress.env("E2E_USER_PASSWORD") ??
      "DemoPassword!23",
    useRealApi: options?.useRealApi ?? false,
  };
};

Cypress.Commands.add("loginAsStubAdmin", (options?: LoginOptions) => {
  cy.clearCookies();
  cy.clearLocalStorage();

  const { path, email, password, useRealApi } = resolveOptions(options);
  const targetPath = path;
  const userEmail = email;
  const userPassword = password;

  if (useRealApi) {
    const apiBaseUrl =
      Cypress.env("E2E_API_BASE_URL") ??
      Cypress.env("API_BASE_URL") ??
      "http://localhost:3000/api/v1";

    cy.intercept("GET", `${apiBaseUrl}/auth/profile`).as("profile");

    cy.request({
      method: "POST",
      url: `${apiBaseUrl}/auth/login`,
      body: {
        email: userEmail,
        password: userPassword,
      },
      failOnStatusCode: false,
    }).then((response) => {
      const { status, body } = response;
      expect(status, "login status").to.be.oneOf([200, 201]);

      const {
        access_token: accessToken,
        refresh_token: refreshToken,
        user,
      } = body as {
        access_token?: string;
        refresh_token?: string;
        user?: typeof stubAdminUser;
      };

      if (!accessToken) {
        throw new Error(
          "El backend no devolvió access_token. Verifica las credenciales del usuario de pruebas."
        );
      }

      cy.window().then((win) => {
        win.localStorage.setItem("authToken", accessToken);
        if (refreshToken) {
          win.localStorage.setItem("refreshToken", refreshToken);
        }
        if (user) {
          win.localStorage.setItem("userData", JSON.stringify(user));
        }
      });
    });

    cy.visit(targetPath);
    cy.wait("@profile");
    return;
  }

  const loginPattern = "**/auth/login*";
  const profilePattern = "**/auth/profile*";
  const refreshPattern = "**/auth/refresh*";
  const logoutPattern = "**/auth/logout*";
  let isAuthenticated = false;

  cy.intercept("OPTIONS", loginPattern, {
    statusCode: 204,
  });
  cy.intercept("POST", loginPattern, (req) => {
    req.reply({
      statusCode: 200,
      body: {
        access_token: "stub-access-token",
        refresh_token: "stub-refresh-token",
        user: stubAdminUser,
      },
    });
    isAuthenticated = true;
  }).as("loginRequest");

  cy.intercept("OPTIONS", profilePattern, {
    statusCode: 204,
  });
  cy.intercept("GET", profilePattern, (req) => {
    if (!isAuthenticated) {
      req.reply({ statusCode: 401, body: { message: "Unauthorized" } });
      return;
    }
    req.reply({ statusCode: 200, body: stubAdminUser });
  }).as("profileRequest");

  cy.intercept("OPTIONS", refreshPattern, {
    statusCode: 204,
  });
  cy.intercept("POST", refreshPattern, {
    statusCode: 200,
    body: {
      access_token: "stub-access-token",
      refresh_token: "stub-refresh-token",
      user: stubAdminUser,
    },
  });

  cy.intercept("OPTIONS", logoutPattern, {
    statusCode: 204,
  });
  cy.intercept("POST", logoutPattern, {
    statusCode: 200,
    body: { message: "ok" },
  });

  cy.visit("/login");

  cy.get('[data-cy="login-email"]', { timeout: 15000 })
    .should("be.visible")
    .clear()
    .type(userEmail);

  cy.get('[data-cy="login-password"]', { timeout: 15000 })
    .should("be.visible")
    .clear()
    .type(userPassword, { log: false });

  cy.get('[data-cy="login-submit"]').click();

  cy.wait("@loginRequest", { timeout: 15000 })
    .its("response.statusCode")
    .should("eq", 200);

  cy.location("pathname", { timeout: 15000 }).should((pathname) => {
    expect(pathname, "stay away from the login page").not.to.contain("/login");
  });

  if (targetPath !== "/") {
    cy.visit(targetPath);
  }
});
