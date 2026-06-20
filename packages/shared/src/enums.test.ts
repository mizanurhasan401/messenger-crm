import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as enums from "./enums";

/**
 * Guards against drift between the canonical TS enums (this package) and the
 * Prisma schema enums. If you add a value in one place, this fails until both match.
 */
const SCHEMA_PATH = join(__dirname, "../../database/prisma/schema.prisma");

function prismaEnumValues(name: string, schema: string): string[] {
  const re = new RegExp(`enum ${name} \\{([^}]*)\\}`, "m");
  const body = schema.match(re)?.[1] ?? "";
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"));
}

const PAIRS: Array<[string, Record<string, string>]> = [
  ["Role", enums.Role],
  ["MemberStatus", enums.MemberStatus],
  ["OrderStatus", enums.OrderStatus],
  ["FollowupStatus", enums.FollowupStatus],
  ["NotableType", enums.NotableType],
  ["NotificationType", enums.NotificationType],
  ["SubscriptionStatus", enums.SubscriptionStatus],
  ["SubscriptionPlan", enums.SubscriptionPlan],
  ["AuditAction", enums.AuditAction],
];

describe("enum parity: @messenger/shared ↔ Prisma schema", () => {
  const schema = readFileSync(SCHEMA_PATH, "utf8");
  for (const [name, obj] of PAIRS) {
    it(`${name} matches`, () => {
      const fromShared = Object.values(obj).sort();
      const fromPrisma = prismaEnumValues(name, schema).sort();
      expect(fromPrisma).toEqual(fromShared);
    });
  }
});
