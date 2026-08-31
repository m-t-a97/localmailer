import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/prisma/db", () => ({
  db: {
    orm: {
      public: {
        ComposedEmails: {
          create: vi.fn(),
          where: vi.fn(),
          orderBy: vi.fn(),
        },
      },
    },
  },
}));

vi.mock("@/config/env-config", () => ({
  default: {
    databaseUrl: "postgresql://localhost/test",
    smtp: {
      host: "localhost",
      port: 2525,
      user: "user",
      pass: "pass",
    },
    logLevel: "info",
  },
}));

import { db } from "@/prisma/db";

import {
  constructAndSaveEmail,
  saveEmail,
  getAllEmails,
  getEmailById,
  deleteEmailById,
} from "./email.service";

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // helpers to configure chainable ORM mocks
  function mockOrderByAll(resolvedValue: unknown) {
    const mockAll = vi.fn().mockResolvedValue(resolvedValue);
    vi.mocked(db.orm.public.ComposedEmails.orderBy).mockReturnValue({ all: mockAll } as any);
    return mockAll;
  }

  function mockWhereAll(resolvedValue: unknown) {
    const mockAll = vi.fn().mockResolvedValue(resolvedValue);
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    const mockFirst = vi.fn().mockResolvedValue(resolvedValue);
    // service currently uses .where({id}).all() and .where({id}).delete()
    // we expose both all/delete/first so tests work regardless of impl
    vi.mocked(db.orm.public.ComposedEmails.where).mockReturnValue({
      all: mockAll,
      delete: mockDelete,
      first: mockFirst,
    } as any);
    return { mockAll, mockDelete, mockFirst };
  }

  describe("constructAndSaveEmail", () => {
    it("sanitizes HTML and saves email", async () => {
      const mockCreate = vi.mocked(db.orm.public.ComposedEmails.create);
      mockCreate.mockResolvedValueOnce({
        id: "email-1",
        from: "test@test.com",
        to: ["recipient@test.com"],
        subject: "Test",
        html: "<p>Safe content</p>",
        text: "Test",
        date: null,
        createdAt: new Date(),
      } as any);

      const result = await constructAndSaveEmail({
        from: "test@test.com",
        to: ["recipient@test.com"],
        subject: "Test",
        html: "<script>alert('xss')</script><p>Safe content</p>",
        text: "Test",
      });

      expect(result.success).toBe(true);
      expect(result.emailId).toBe("email-1");

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const savedData = mockCreate.mock.calls[0][0] as any;
      expect(savedData.html).not.toContain("<script>");
      expect(savedData.html).toContain("<p>Safe content</p>");
      expect(savedData.from).toBe("test@test.com");
      expect(savedData.to).toEqual(["recipient@test.com"]);
      expect(savedData.date).toBeNull();
    });

    it("returns error when save fails", async () => {
      const mockCreate = vi.mocked(db.orm.public.ComposedEmails.create);
      mockCreate.mockRejectedValueOnce(new Error("DB error"));

      const result = await constructAndSaveEmail({
        from: "test@test.com",
        to: ["recipient@test.com"],
        subject: "Test",
        html: "<p>Hello</p>",
        text: "Hello",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("saveEmail", () => {
    it("sanitizes html and creates via ORM", async () => {
      const mockCreate = vi.mocked(db.orm.public.ComposedEmails.create);
      mockCreate.mockResolvedValueOnce({
        id: "id-2",
        from: "a@test.com",
        to: ["b@test.com"],
        subject: "Sub",
        html: "<p>clean</p>",
        text: "clean",
        date: null,
        createdAt: new Date(),
      } as any);

      const result = await saveEmail({
        from: "a@test.com",
        to: ["b@test.com"],
        subject: "Sub",
        html: "<script>x</script><p>clean</p>",
        text: "clean",
        date: null,
      });

      expect(result.id).toBe("id-2");
      const arg = mockCreate.mock.calls[0][0] as any;
      expect(arg.html).not.toContain("<script>");
    });

    it("passes Temporal.Instant when date is provided (fallback to Date if Temporal unavailable)", async () => {
      const mockCreate = vi.mocked(db.orm.public.ComposedEmails.create);
      mockCreate.mockResolvedValueOnce({
        id: "id-3",
        from: "a@test.com",
        to: ["b@test.com"],
        subject: "Sub",
        html: "<p>hi</p>",
        text: "hi",
        date: new Date("2024-01-01T00:00:00.000Z"),
        createdAt: new Date(),
      } as any);

      const date = new Date("2024-01-01T00:00:00.000Z");
      await saveEmail({
        from: "a@test.com",
        to: ["b@test.com"],
        subject: "Sub",
        html: "<p>hi</p>",
        text: "hi",
        date,
      });

      const arg = mockCreate.mock.calls[0][0] as any;
      // service converts Date -> Temporal.Instant when Temporal is available, otherwise keeps Date
      if (typeof (globalThis as any).Temporal !== "undefined") {
        expect(arg.date).toBeDefined();
        expect(arg.date.epochMilliseconds).toBe(date.getTime());
      } else {
        expect(arg.date).toEqual(date);
      }
    });

    it("rejects when validation fails on returned record", async () => {
      const mockCreate = vi.mocked(db.orm.public.ComposedEmails.create);
      mockCreate.mockResolvedValueOnce({
        id: "",
        from: "not-an-email",
        to: [],
        subject: "",
        html: "",
        text: "",
        date: null,
        createdAt: new Date(),
      } as any);

      await expect(
        saveEmail({
          from: "not-an-email",
          to: [],
          subject: "",
          html: "",
          text: "",
          date: null,
        }),
      ).rejects.toThrow("error");
    });
  });

  describe("getAllEmails", () => {
    it("returns mapped emails ordered by createdAt desc", async () => {
      const records = [
        {
          id: "1",
          from: "a@test.com",
          to: ["b@test.com"],
          subject: "Hello",
          html: "<p>hi</p>",
          text: "hi",
          date: null,
          createdAt: new Date("2024-02-01"),
        },
        {
          id: "2",
          from: "c@test.com",
          to: ["d@test.com"],
          subject: "World",
          html: "<p>world</p>",
          text: "world",
          date: null,
          createdAt: new Date("2024-01-01"),
        },
      ];
      mockOrderByAll(records);

      const result = await getAllEmails();

      expect(db.orm.public.ComposedEmails.orderBy).toHaveBeenCalledTimes(1);
      const orderByFn = vi.mocked(db.orm.public.ComposedEmails.orderBy).mock.calls[0][0] as any;
      const fakeProxy: any = { createdAt: { desc: () => "desc-val" } };
      expect(orderByFn(fakeProxy)).toBe("desc-val");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("1");
    });

    it("returns empty array when no records", async () => {
      mockOrderByAll([]);
      const result = await getAllEmails();
      expect(result).toEqual([]);
    });

    it("filters out invalid records", async () => {
      const valid = {
        id: "1",
        from: "a@test.com",
        to: ["b@test.com"],
        subject: "Ok",
        html: "<p>ok</p>",
        text: "ok",
        date: null,
        createdAt: new Date(),
      };
      const invalid = {
        id: "",
        from: "bad",
        to: "not-array",
        subject: "",
        html: "",
        text: "",
        date: null,
        createdAt: "bad",
      };
      mockOrderByAll([valid, invalid]);
      const result = await getAllEmails();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("returns [] on db error", async () => {
      const mockAll = vi.fn().mockRejectedValue(new Error("db down"));
      vi.mocked(db.orm.public.ComposedEmails.orderBy).mockReturnValue({ all: mockAll } as any);
      const result = await getAllEmails();
      expect(result).toEqual([]);
    });
  });

  describe("getEmailById", () => {
    it("returns email when found (supports both .all() array and .first() single)", async () => {
      const record = {
        id: "email-1",
        from: "a@test.com",
        to: ["b@test.com"],
        subject: "Hi",
        html: "<p>hi</p>",
        text: "hi",
        date: null,
        createdAt: new Date(),
      };
      mockWhereAll(record);

      const result = await getEmailById("email-1");

      expect(db.orm.public.ComposedEmails.where).toHaveBeenCalledWith({ id: "email-1" });
      expect(result?.id).toBe("email-1");
    });

    it("returns null when record not found", async () => {
      mockWhereAll(null);
      const result = await getEmailById("missing");
      expect(result).toBeNull();
    });

    it("returns null when validation fails", async () => {
      mockWhereAll({
        id: "",
        from: "bad",
        to: [],
        subject: "",
        html: "",
        text: "",
        date: null,
        createdAt: new Date(),
      });
      const result = await getEmailById("bad-id");
      expect(result).toBeNull();
    });

    it("returns null on db error", async () => {
      const mockAll = vi.fn().mockRejectedValue(new Error("db error"));
      vi.mocked(db.orm.public.ComposedEmails.where).mockReturnValue({ all: mockAll } as any);
      const result = await getEmailById("any");
      expect(result).toBeNull();
    });
  });

  describe("deleteEmailById", () => {
    it("deletes via where(id).delete()", async () => {
      const { mockDelete } = mockWhereAll(null);
      await deleteEmailById("email-1");
      expect(db.orm.public.ComposedEmails.where).toHaveBeenCalledWith({ id: "email-1" });
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it("throws on failure", async () => {
      const mockDelete = vi.fn().mockRejectedValue(new Error("fail"));
      vi.mocked(db.orm.public.ComposedEmails.where).mockReturnValue({
        all: vi.fn(),
        delete: mockDelete,
      } as any);
      await expect(deleteEmailById("x")).rejects.toThrow("Failed to delete email");
    });
  });
});
