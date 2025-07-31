import { NativeModule, requireNativeModule } from "expo";

import type {
  PrintConnectModuleActions,
  PrinterStatusResponse,
  PrintResponse,
} from "./ExpoZebraPrintConnect.types";

declare class ExpoZebraPrintConnectModule extends NativeModule<PrintConnectModuleActions> {
  unselectPrinter: () => Promise<PrintResponse>;
  getPrinterStatus: () => Promise<PrinterStatusResponse>;
  print: (zpl: string) => Promise<PrintResponse>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoZebraPrintConnectModule>(
  "ExpoZebraPrintConnect"
);
