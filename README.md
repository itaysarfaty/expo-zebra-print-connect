# expo-zebra-print-connect

A React Native Expo module for connecting to Zebra printers using Zebra's Print Connect service.

## Installation

Install the module using Expo CLI:

```bash
npx expo install expo-zebra-print-connect
```

## Quick Start

```javascript
import ExpoZebraPrintConnect from "expo-zebra-print-connect";

// Example: Get printer status
const checkPrinter = async () => {
  try {
    const status = await ExpoZebraPrintConnect.getPrinterStatus();
    if (status.success) {
      console.log("Printer is ready:", status.data.isReadyToPrint);
      console.log("Printer name:", status.data.friendlyName);
    }
  } catch (error) {
    console.error("Error checking printer:", error);
  }
};

// Example: Print using ZPL commands
const printLabel = async () => {
  const zplCommand = `
    ^XA
    ^FO50,50^A0N,50,50^FDHello World!^FS
    ^XZ
  `;

  try {
    const result = await ExpoZebraPrintConnect.passthrough(zplCommand);
    if (result.success) {
      console.log("Print successful!");
    } else {
      console.log("Print failed:", result.message);
    }
  } catch (error) {
    console.error("Print error:", error);
  }
};
```

## API Reference

### Methods

#### `getPrinterStatus(): Promise<PrinterStatusResponse>`

Retrieves the current status of the connected Zebra printer.

**Returns:**

```typescript
{
  success: boolean;
  message: string;
  data: {
    friendlyName: string;
    isHeadCold: boolean;
    isHeadOpen: boolean;
    isPaused: boolean;
    isRibbonOut: boolean;
    isPaperOut: boolean;
    isReceiveBufferFull: boolean;
    isHeadTooHot: boolean;
    isReadyToPrint: boolean;
    isPartialFormatInProgress: boolean;
  }
}
```

#### `passthrough(zpl: string): Promise<PrintResponse>`

Sends ZPL (Zebra Programming Language) commands directly to the printer.

**Parameters:**

- `zpl` (string) - The ZPL command string to send to the printer

**Returns:**

```typescript
{
  success: boolean;
  message: string;
}
```

#### `unselectPrinter(): Promise<PrintResponse>`

Unselects the currently connected printer.

**Returns:**

```typescript
{
  success: boolean;
  message: string;
}
```

## Usage Examples

### Check if Printer is Ready

```javascript
const isPrinterReady = async () => {
  const status = await ExpoZebraPrintConnect.getPrinterStatus();

  if (status.success) {
    const { data } = status;

    if (data.isReadyToPrint) {
      console.log(`${data.friendlyName} is ready to print!`);
      return true;
    } else {
      console.log("Printer is not ready:");
      if (data.isPaperOut) console.log("- Paper is out");
      if (data.isRibbonOut) console.log("- Ribbon is out");
      if (data.isHeadOpen) console.log("- Head is open");
      if (data.isHeadTooHot) console.log("- Head is too hot");
      return false;
    }
  }

  return false;
};
```

### Print a Barcode Label

```javascript
const printBarcodeLabel = async (barcodeData, description) => {
  const zpl = `
    ^XA
    ^FO50,50^BY2
    ^BCN,70,Y,N,N
    ^FD${barcodeData}^FS
    ^FO50,150^A0N,25,25^FD${description}^FS
    ^XZ
  `;

  const result = await ExpoZebraPrintConnect.passthrough(zpl);
  return result.success;
};

// Usage
printBarcodeLabel("123456789", "Product Code");
```

## Supported Zebra Print Connect Intents

This module currently supports **3 out of 7** available Zebra Print Connect intents:

| Supported | Intent                      | Service                                                        |
| :-------: | --------------------------- | -------------------------------------------------------------- |
|    ✅     | Passthrough                 | `com.zebra.printconnect.print.PassthroughService`              |
|    ✅     | Get Printer Status          | `com.zebra.printconnect.print.GetPrinterStatusService`         |
|    ✅     | Unselect Printer            | `com.zebra.printconnect.print.UnselectPrinterService`          |
|    ❌     | Template Print              | `com.zebra.printconnect.print.TemplatePrintService`            |
|    ❌     | Template Print with Content | `com.zebra.printconnect.print.TemplatePrintWithContentService` |
|    ❌     | Line Print Passthrough      | `com.zebra.printconnect.print.LinePrintPassthroughService`     |
|    ❌     | Graphic Print               | `com.zebra.printconnect.print.GraphicPrintService`             |

## TypeScript Support

This module includes full TypeScript definitions:

```typescript
import ExpoZebraPrintConnect, {
  PrintResponse,
  PrintResponseWithData<T>,
  PrinterStatusData,
  PrinterStatusResponse,
  PrintConnectActions
} from "expo-zebra-print-connect";
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
