import { DateUtils } from "./date.utils";

describe("Date Utils", () => {
  describe("format", () => {
    test("should format the date correctly", () => {
      const date = new Date("2025-03-06T02:57:51.247Z");

      const actual = DateUtils.format(date);

      expect(actual).toEqual("Mar 06 2025, 02:57 AM");
    });
  });
});
