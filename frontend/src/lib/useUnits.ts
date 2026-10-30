import { useProperty } from "@tollbooth-dpyc/web/react";
import type { UnitSystem } from "./units";

/** The patron's display units, kept on this device. */
export const useUnits = () => useProperty<UnitSystem>("units", "si");
