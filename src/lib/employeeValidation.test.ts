import { describe, it, expect } from "vitest";
import {
  validateCreateEmployee,
  usernameSchema,
  tempPasswordSchema,
  phoneSchema,
} from "@/lib/employeeValidation";

describe("employeeValidation", () => {
  it("rejects short usernames", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
  });
  it("rejects invalid username characters", () => {
    expect(usernameSchema.safeParse("Bad Name!").success).toBe(false);
  });
  it("accepts valid usernames", () => {
    expect(usernameSchema.safeParse("john.doe_1").success).toBe(true);
  });
  it("rejects short passwords", () => {
    expect(tempPasswordSchema.safeParse("abc1").success).toBe(false);
  });
  it("rejects letters-only passwords", () => {
    expect(tempPasswordSchema.safeParse("abcdefgh").success).toBe(false);
  });
  it("accepts strong temp passwords", () => {
    expect(tempPasswordSchema.safeParse("Welcome123").success).toBe(true);
  });
  it("accepts empty phone (optional)", () => {
    expect(phoneSchema.safeParse("").success).toBe(true);
  });
  it("rejects bad phones", () => {
    expect(phoneSchema.safeParse("abc").success).toBe(false);
  });
  it("accepts valid phones", () => {
    expect(phoneSchema.safeParse("+91 98765 43210").success).toBe(true);
  });

  it("aggregates errors across fields", () => {
    const errs = validateCreateEmployee({
      email: "bad",
      fullName: "",
      username: "!!",
      phone: "abc",
      tempPassword: "short",
    });
    expect(errs.email).toBeDefined();
    expect(errs.fullName).toBeDefined();
    expect(errs.username).toBeDefined();
    expect(errs.phone).toBeDefined();
    expect(errs.tempPassword).toBeDefined();
  });

  it("passes with valid input", () => {
    const errs = validateCreateEmployee({
      email: "jane@example.com",
      fullName: "Jane Doe",
      username: "jane.doe",
      phone: "+919876543210",
      tempPassword: "Welcome123",
    });
    expect(errs).toEqual({});
  });
});
