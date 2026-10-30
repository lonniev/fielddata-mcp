import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { convert, formatQuantity, formatTick } from "./units.ts";

describe("convert", () => {
  it("leaves SI alone", () => assert.equal(convert(1013.2, "hPa", "si").value, 1013.2));
  it("converts each US unit", () => {
    assert.equal(convert(0, "°C", "us").value, 32);
    assert.equal(convert(100, "°C", "us").value, 212);
    assert.equal(convert(25.4, "mm", "us").value, 1);
    assert.ok(Math.abs(convert(1013.25, "hPa", "us").value - 29.92) < 0.01);
    assert.ok(Math.abs(convert(10, "m/s", "us").value - 22.37) < 0.01);
  });
  it("has no US form of a percentage", () => assert.equal(convert(52, "%", "us").unit, "%"));
});

describe("formatQuantity", () => {
  it("writes the figure and its unit", () => {
    assert.equal(formatQuantity(21.44, "°C", "si"), "21.4 °C");
    assert.equal(formatQuantity(0, "°C", "us"), "32.0 °F");
  });
  it("writes an index bare and a bearing in degrees", () => {
    assert.equal(formatQuantity(7, "index", "si"), "7.0");
    assert.equal(formatQuantity(182, "deg", "si"), "182°");
  });
});

describe("formatTick", () => {
  it("keeps a decimal only where the unit needs one", () => {
    assert.equal(formatTick(50, "°C", "us"), "122");
    assert.equal(formatTick(1000, "hPa", "us"), "29.5");
  });
});
