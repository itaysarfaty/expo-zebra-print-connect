import { NativeModule, requireNativeModule } from "expo";

import type {
  PrintConnectActions,
  PrinterStatusResponse,
  PrintResponse,
} from "./ExpoZebraPrintConnect.types";

declare class ExpoZebraPrintConnectModule extends NativeModule<PrintConnectActions> {
  unselectPrinter: () => Promise<PrintResponse>;
  getPrinterStatus: () => Promise<PrinterStatusResponse>;
  passthrough: (zpl: string) => Promise<PrintResponse>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoZebraPrintConnectModule>(
  "ExpoZebraPrintConnect"
);
