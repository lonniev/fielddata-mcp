import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compassPoint, instrumentFor, instrumentLabel, needleAngle, polar, scaleRatio } from "./instruments.ts";

describe("scaleRatio", () => {
  it("places a quantity on its scale", () => assert.equal(scaleRatio(1000, 950, 1050), 0.5));
  it("pins off-scale readings at the ends", () => {
    assert.equal(scaleRatio(-5, 0, 10), 0);
    assert.equal(scaleRatio(50, 0, 10), 1);
  });
  it("rests on anything that is not a number", () => assert.equal(scaleRatio(Number.NaN, 0, 10), 0));
});

describe("needleAngle", () => {
  it("sweeps 270° centred on twelve o'clock", () => {
    assert.equal(needleAngle(0), -135);
    assert.equal(needleAngle(0.5), 0);
    assert.equal(needleAngle(1), 135);
  });
});

describe("polar", () => {
  it("measures clockwise from twelve", () => {
    const [x, y] = polar(100, 100, 50, 90);
    assert.ok(Math.abs(x - 150) < 1e-9 && Math.abs(y - 100) < 1e-9);
  });
});

describe("compassPoint", () => {
  it("names the sixteen points and wraps", () => {
    assert.equal(compassPoint(0), "N");
    assert.equal(compassPoint(45), "NE");
    assert.equal(compassPoint(359), "N");
    assert.equal(compassPoint(-90), "W");
  });
});

describe("instrumentFor", () => {
  it("draws an unknown kind as a labelled readout", () => {
    const spec = instrumentFor("sap_flow");
    assert.equal(spec.form, "readout");
    assert.equal(spec.name, "Sap flow");
  });
});

describe("instrumentLabel", () => {
  it("prefers the probe's own name, then its channel", () => {
    assert.equal(instrumentLabel("soil_moisture", 2, "Tomatoes"), "Soil moisture: Tomatoes");
    assert.equal(instrumentLabel("soil_moisture", 2, null), "Soil moisture 2");
    assert.equal(instrumentLabel("pressure", null, null), "Barometer");
  });
});
