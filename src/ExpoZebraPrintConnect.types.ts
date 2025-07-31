export interface PrintResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface PrinterStatusResponse extends PrintResponse {
  data: {
    isHeadCold: string;
    isHeadOpen: string;
    isPaused: string;
    isRibbonOut: string;
    isPaperOut: string;
    isReceiveBufferFull: string;
    isHeadTooHot: string;
    isReadyToPrint: string;
    friendlyName: string;
    isPartialFormatInProgress: string;
  };
}

export type PrintConnectModuleActions = {
  unselectPrinter: () => Promise<PrintResponse>;
  getPrinterStatus: () => Promise<PrinterStatusResponse>;
  print: (zpl: string) => Promise<PrintResponse>;
};
