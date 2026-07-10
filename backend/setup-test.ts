import { beforeAll } from "vitest";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/we-the-yuva-vms_test";
process.env.JWT_ACCESS_SECRET = "test-secret-at-least-32-chars-long-access";
process.env.JWT_REFRESH_SECRET = "test-secret-at-least-32-chars-long-refresh";
process.env.FRONTEND_URL = "http://localhost:3000";
