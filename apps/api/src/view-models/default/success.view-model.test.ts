import { describe, expect, it } from "vitest";
import { PaginationViewModel } from "./pagination.view-model";
import { SuccessViewModel } from "./success.view-model";

describe("SuccessViewModel", () => {
  describe("create", () => {
    it("should create instance with data, message and code", () => {
      const vm = SuccessViewModel.create({
        data: { id: "123", name: "Test" },
        message: "Retrieved",
        code: "RETRIEVED",
      });

      expect(vm.success).toBe(true);
      expect(vm.data).toEqual({ id: "123", name: "Test" });
      expect(vm.pagination).toBeUndefined();
      expect(vm.message).toBe("Retrieved");
      expect(vm.code).toBe("RETRIEVED");
    });

    it("should create instance with data, pagination, message and code", () => {
      const pagination = PaginationViewModel.create({
        page: 1,
        limit: 10,
        totalItems: 100,
      });

      const vm = SuccessViewModel.create({
        data: { items: ["a", "b"] },
        pagination,
        message: "Items retrieved",
        code: "ITEMS_RETRIEVED",
      });

      expect(vm.success).toBe(true);
      expect(vm.data).toEqual({ items: ["a", "b"] });
      expect(vm.pagination).toBe(pagination);
      expect(vm.message).toBe("Items retrieved");
      expect(vm.code).toBe("ITEMS_RETRIEVED");
    });

    it("should create instance without data", () => {
      const vm = SuccessViewModel.create({
        message: "Operation completed",
        code: "COMPLETED",
      });

      expect(vm.success).toBe(true);
      expect(vm.data).toBeUndefined();
      expect(vm.pagination).toBeUndefined();
      expect(vm.message).toBe("Operation completed");
      expect(vm.code).toBe("COMPLETED");
    });

    it("should handle array data", () => {
      const vm = SuccessViewModel.create({
        data: [1, 2, 3],
        message: "Retrieved",
        code: "RETRIEVED",
      });

      expect(vm.success).toBe(true);
      expect(vm.data).toEqual([1, 2, 3]);
    });

    it("should handle empty array data", () => {
      const vm = SuccessViewModel.create({
        data: [],
        message: "Retrieved",
        code: "RETRIEVED",
      });

      expect(vm.success).toBe(true);
      expect(vm.data).toEqual([]);
    });

    it("should handle string data", () => {
      const vm = SuccessViewModel.create({
        data: "hello",
        message: "Retrieved",
        code: "RETRIEVED",
      });

      expect(vm.success).toBe(true);
      expect(vm.data).toBe("hello");
    });

    it("should handle number data", () => {
      const vm = SuccessViewModel.create({
        data: 42,
        message: "Retrieved",
        code: "RETRIEVED",
      });

      expect(vm.success).toBe(true);
      expect(vm.data).toBe(42);
    });

    it("should handle boolean data", () => {
      const vm = SuccessViewModel.create({
        data: true,
        message: "Retrieved",
        code: "RETRIEVED",
      });

      expect(vm.success).toBe(true);
      expect(vm.data).toBe(true);
    });
  });

  describe("toJSON", () => {
    it("should return correct JSON with data, message and code", () => {
      const vm = SuccessViewModel.create({
        data: { id: "123" },
        message: "Retrieved",
        code: "RETRIEVED",
      });
      const json = vm.toJSON();

      expect(json).toEqual({
        success: true,
        message: "Retrieved",
        code: "RETRIEVED",
        data: { id: "123" },
      });
    });

    it("should return correct JSON with data, pagination, message and code", () => {
      const pagination = PaginationViewModel.create({
        page: 1,
        limit: 10,
        totalItems: 100,
      });

      const vm = SuccessViewModel.create({
        data: { items: ["a"] },
        pagination,
        message: "Items retrieved",
        code: "ITEMS_RETRIEVED",
      });
      const json = vm.toJSON();

      expect(json).toEqual({
        success: true,
        message: "Items retrieved",
        code: "ITEMS_RETRIEVED",
        data: { items: ["a"] },
        pagination: {
          currentPage: 1,
          totalPages: 10,
          totalItems: 100,
          itemsPerPage: 10,
          hasNextPage: true,
          hasPrevPage: false,
        },
      });
    });

    it("should return correct JSON without data", () => {
      const vm = SuccessViewModel.create({
        message: "Operation completed",
        code: "COMPLETED",
      });
      const json = vm.toJSON();

      expect(json).toEqual({
        success: true,
        message: "Operation completed",
        code: "COMPLETED",
      });
    });

    it("should return correct JSON with all fields", () => {
      const pagination = PaginationViewModel.create({
        page: 2,
        limit: 10,
        totalItems: 50,
      });

      const vm = SuccessViewModel.create({
        data: { users: ["john", "jane"] },
        pagination,
        message: "Users retrieved",
        code: "USERS_RETRIEVED",
      });
      const json = vm.toJSON();

      expect(json).toEqual({
        success: true,
        message: "Users retrieved",
        code: "USERS_RETRIEVED",
        data: { users: ["john", "jane"] },
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 50,
          itemsPerPage: 10,
          hasNextPage: true,
          hasPrevPage: true,
        },
      });
    });
  });
});
