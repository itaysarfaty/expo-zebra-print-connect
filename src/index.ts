// Reexport the native module. On web, it will be resolved to ExpoZebraPrintConnectModule.web.ts
// and on native platforms to ExpoZebraPrintConnectModule.ts
export { default } from "./ExpoZebraPrintConnectModule";
export * from "./ExpoZebraPrintConnect.types";
