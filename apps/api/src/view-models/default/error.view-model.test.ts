import { describe, expect, it } from "vitest";
import { ApiErrorViewModel } from "./error.view-model";

describe("ApiErrorViewModel", () => {
  describe("constructor", () => {
    it("should create instance with message and code", () => {
      const vm = new ApiErrorViewModel(
        "Something went wrong",
        "INTERNAL_ERROR",
      );

      expect(vm.success).toBe(false);
      expect(vm.message).toBe("Something went wrong");
      expect(vm.code).toBe("INTERNAL_ERROR");
    });

    it("should create instance with not found error", () => {
      const vm = new ApiErrorViewModel("Not found", "NOT_FOUND");

      expect(vm.success).toBe(false);
      expect(vm.message).toBe("Not found");
      expect(vm.code).toBe("NOT_FOUND");
    });

    it("should create instance with empty string message", () => {
      const vm = new ApiErrorViewModel("", "UNKNOWN_ERROR");

      expect(vm.success).toBe(false);
      expect(vm.message).toBe("");
      expect(vm.code).toBe("UNKNOWN_ERROR");
    });
  });

  describe("toJSON", () => {
    it("should return correct JSON with message and code", () => {
      const vm = new ApiErrorViewModel(
        "Something went wrong",
        "INTERNAL_ERROR",
      );
      const json = vm.toJSON();

      expect(json).toEqual({
        success: false,
        message: "Something went wrong",
        code: "INTERNAL_ERROR",
      });
    });

    it("should return correct JSON with not found error", () => {
      const vm = new ApiErrorViewModel("Resource not found", "NOT_FOUND");
      const json = vm.toJSON();

      expect(json).toEqual({
        success: false,
        message: "Resource not found",
        code: "NOT_FOUND",
      });
    });

    it("should always include code in JSON", () => {
      const vm = new ApiErrorViewModel("Error", "ERROR_CODE");
      const json = vm.toJSON();

      expect(json).toHaveProperty("code", "ERROR_CODE");
    });

    it("should handle empty error message", () => {
      const vm = new ApiErrorViewModel("", "UNKNOWN_ERROR");
      const json = vm.toJSON();

      expect(json).toEqual({
        success: false,
        message: "",
        code: "UNKNOWN_ERROR",
      });
    });

    it("should handle special characters in error message", () => {
      const vm = new ApiErrorViewModel(
        "Error with special chars: <>&\"'",
        "SPECIAL_ERROR",
      );
      const json = vm.toJSON();

      expect(json).toEqual({
        success: false,
        message: "Error with special chars: <>&\"'",
        code: "SPECIAL_ERROR",
      });
    });

    it("should handle long error message", () => {
      const longMessage = "A".repeat(1000);
      const vm = new ApiErrorViewModel(longMessage, "LONG_ERROR");
      const json = vm.toJSON();

      expect(json.message).toBe(longMessage);
    });

    it("should handle various error codes", () => {
      const codes = [
        "VALIDATION_ERROR",
        "UNAUTHORIZED",
        "FORBIDDEN",
        "INTERNAL_ERROR",
        "404",
      ];

      codes.forEach((code) => {
        const vm = new ApiErrorViewModel("Error", code);
        const json = vm.toJSON();

        expect(json.code).toBe(code);
      });
    });
  });
});
