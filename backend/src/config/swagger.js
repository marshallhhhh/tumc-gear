import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "TUMC Gear API",
      version: "2.0.0",
      description:
        "API for the TUMC Climbing Club Gear Management System — track inventory items, QR tags, loans, and found-item reports.",
    },
    servers: [{ url: "/", description: "Current server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Supabase-issued JWT. Include as `Authorization: Bearer <token>`.",
        },
      },
      schemas: {
        // ── Reusable error envelope ──
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Upper-snake-case error code",
              example: "NOT_FOUND",
            },
            message: {
              type: "string",
              description: "Human-readable message",
              example: "Resource not found.",
            },
            details: {
              type: "object",
              description: "Field-level errors or contextual info",
              example: {},
            },
          },
          required: ["error", "message", "details"],
        },

        // ── Pagination meta (flat, mixed into list responses) ──
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            pageSize: { type: "integer", example: 50 },
            totalCount: { type: "integer", example: 120 },
            totalPages: { type: "integer", example: 3 },
          },
        },

        // ── Domain models ──
        Category: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Harness" },
            prefix: { type: "string", example: "HAR", maxLength: 3 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        Item: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Black Diamond Harness" },
            description: { type: "string", nullable: true },
            categoryId: { type: "string", format: "uuid", nullable: true },
            category: { $ref: "#/components/schemas/Category" },
            serialNumber: { type: "string", nullable: true },
            shortId: { type: "string", example: "HAR-001" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            qrTag: { $ref: "#/components/schemas/QrTag" },
          },
        },

        ItemListItem: {
          type: "object",
          description: "Item as returned in the admin list endpoint",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            categoryId: { type: "string", format: "uuid", nullable: true },
            category: { $ref: "#/components/schemas/Category" },
            serialNumber: { type: "string", nullable: true },
            shortId: { type: "string", example: "HAR-001" },
            hasActiveLoan: { type: "boolean" },
            qrTag: { $ref: "#/components/schemas/QrTag" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        QrTag: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            nanoid: {
              type: "string",
              example: "Ab3xYz",
              minLength: 6,
              maxLength: 6,
            },
            itemId: { type: "string", format: "uuid", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        Loan: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            itemId: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: ["ACTIVE", "RETURNED", "CANCELLED"],
            },
            dueDate: { type: "string", format: "date-time" },
            checkoutDate: { type: "string", format: "date-time" },
            returnDate: { type: "string", format: "date-time", nullable: true },
            openedLatitude: { type: "number", format: "double" },
            openedLongitude: { type: "number", format: "double" },
            closedLatitude: {
              type: "number",
              format: "double",
              nullable: true,
            },
            closedLongitude: {
              type: "number",
              format: "double",
              nullable: true,
            },
            cancelledBy: { type: "string", format: "uuid", nullable: true },
            cancelledAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            item: { $ref: "#/components/schemas/Item" },
            user: { $ref: "#/components/schemas/UserSummary" },
          },
        },

        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            fullName: { type: "string" },
            role: { type: "string", enum: ["MEMBER", "ADMIN"] },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        UserSummary: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            fullName: { type: "string" },
          },
        },

        FoundReport: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            itemId: { type: "string", format: "uuid" },
            reportedBy: { type: "string", format: "uuid", nullable: true },
            contactInfo: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            latitude: { type: "number", format: "double", nullable: true },
            longitude: { type: "number", format: "double", nullable: true },
            status: { type: "string", enum: ["OPEN", "CLOSED"] },
            createdAt: { type: "string", format: "date-time" },
            closedAt: { type: "string", format: "date-time", nullable: true },
            closedBy: { type: "string", format: "uuid", nullable: true },
          },
        },

        DashboardStats: {
          type: "object",
          properties: {
            totalItems: { type: "integer", example: 42 },
            openFoundReports: { type: "integer", example: 3 },
            activeLoans: { type: "integer", example: 15 },
            overdueLoans: { type: "integer", example: 2 },
            totalUsers: { type: "integer", example: 87 },
          },
        },
      },

      parameters: {
        PageParam: {
          in: "query",
          name: "page",
          schema: { type: "integer", minimum: 1, default: 1 },
          description: "Page number (1-indexed)",
        },
        PageSizeParam: {
          in: "query",
          name: "pageSize",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
          description: "Items per page (max 100)",
        },
        SortOrderParam: {
          in: "query",
          name: "sortOrder",
          schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
          description: "Sort direction",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
