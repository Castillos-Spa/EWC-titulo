# Backend Architecture Diagrams

This README captures Mermaid diagrams that describe the main backend modules and how data flows between them. Each code block can be rendered in editors that support Mermaid (VS Code, GitHub, etc.).

## 1. High-Level Request Flow

```mermaid
flowchart LR
    Client((Client Apps)) -->|HTTP REST| API[Controllers]
    API --> AuthGuard{JWT/Role Guards}
    AuthGuard --> Services
    Services --> Prisma[(Prisma ORM)]
    Prisma --> Database[(PostgreSQL)]
    Services --> Events(EventEmitter2)
    Events --> NotificationGateway[/WebSocket Gateway/]
```

## 2. Auth Module

```mermaid
flowchart TD
    subgraph HTTP Layer
        AC[AuthController]
        LG[LocalAuthGuard]
        JG[JwtAuthGuard]
    end
    subgraph Domain Layer
        AS[AuthService]
        US[UsersService]
    end
    subgraph Infrastructure
        JWT[JwtService]
        CFG[ConfigService]
        PR[PrismaService]
    end

    LG --> AC
    AC --> AS
    JG --> AC
    AS --> US
    AS --> JWT
    AS --> CFG
    US --> PR
```

## 3. Notification Module

```mermaid
flowchart LR
    NC[NotificationController] -->|Create/List/Update| NS[NotificationService]
    NS -->|DB Ops| PR[PrismaService]
    NS -->|Broadcast| NG[NotificationGateway]
    NG --> Users((Subscribed Clients))
    NS -->|ticket.* events| TicketModule
    NS -->|workshop.* events| WorkshopModule
```

## 4. Routes & Transport Planning

```mermaid
flowchart TD
    RC[RoutesController] --> RS[RoutesService]
    RS --> PR[PrismaService]
    RS -->|Assignments| TA[(TruckAssignment Records)]
    RC -->|Validated DTOs| RC
    RS -->|Emits data to| DashboardService
```

## 5. Workshop & Work Orders

```mermaid
flowchart LR
    WC[WorkshopController] --> WS[WorkshopService]
    WS --> WOS[WorkOrderService]
    WS --> VS[VehicleService]
    WS --> US[UsersService]
    WOS --> PR[PrismaService]
    VS --> PR
    WOS --> EV[EventEmitter2]
    EV --> Notifications[NotificationService]
```

## 6. Integrated Journey (Testing Perspective)

```mermaid
sequenceDiagram
    participant Tester
    participant UsersCtrl as UsersController
    participant AuthCtrl as AuthController
    participant RoutesCtrl as RoutesController
    participant WorkshopCtrl as WorkshopController
    participant DashboardCtrl as DashboardController

    Tester->>UsersCtrl: POST /users (register)
    UsersCtrl->>UsersService: register()
    UsersService->>Prisma: create user & roles
    Tester->>AuthCtrl: POST /auth/login
    AuthCtrl->>AuthService: login()
    AuthService->>UsersService: setRefreshToken()
    Tester->>RoutesCtrl: POST /routes
    RoutesCtrl->>RoutesService: create route
    Tester->>RoutesCtrl: POST /routes/assignments
    RoutesService->>Prisma: create assignment
    Tester->>WorkshopCtrl: POST /workshop/work-orders
    WorkshopCtrl->>WorkOrderService: create()
    Tester->>DashboardCtrl: GET /dashboard/overview
    DashboardCtrl->>DashboardService: aggregate modules
```

Use these diagrams as a living reference; update them when wiring or responsibilities shift so onboarding teammates can visualize the system quickly.
