import { describe, expect, it } from "vitest";
import { canTransition } from "./constants";

describe("order status machine", () => {
  it("allows valid forward transitions", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PROCESSING")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransition("PENDING", "DELIVERED")).toBe(false);
    expect(canTransition("DELIVERED", "PENDING")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
  });

  it("treats terminal states as dead ends", () => {
    expect(canTransition("RETURNED", "PENDING")).toBe(false);
    expect(canTransition("CANCELLED", "PROCESSING")).toBe(false);
  });
});
