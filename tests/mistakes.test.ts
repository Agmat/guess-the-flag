import { describe, expect, it } from "vitest";
import {
  parseMistakeList,
  withMistake,
  withoutMistake,
} from "../src/lib/mistakes";

describe("mistakes list", () => {
  it("parses a stored array, ignoring junk", () => {
    expect(parseMistakeList(null)).toEqual([]);
    expect(parseMistakeList("not json")).toEqual([]);
    expect(parseMistakeList('{"a":1}')).toEqual([]);
    expect(parseMistakeList('["FR", 3, "US", null]')).toEqual(["FR", "US"]);
  });

  it("adds a code once", () => {
    expect(withMistake([], "FR")).toEqual(["FR"]);
    expect(withMistake(["FR"], "US")).toEqual(["FR", "US"]);
    expect(withMistake(["FR"], "FR")).toEqual(["FR"]);
  });

  it("removes a code if present", () => {
    expect(withoutMistake(["FR", "US"], "FR")).toEqual(["US"]);
    expect(withoutMistake(["US"], "FR")).toEqual(["US"]);
    expect(withoutMistake([], "FR")).toEqual([]);
  });
});
