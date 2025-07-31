export interface PrintResponse {
  success: boolean;
  message: string;
}
export interface PrintResponseWithData<T = any> extends PrintResponse {
  data?: T;
}

// Specific printer status data structure
export interface PrinterStatusData {
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
}

// Enhanced printer status response
export interface PrinterStatusResponse
  extends PrintResponseWithData<PrinterStatusData> {}

export type PrintConnectActions = {
  unselectPrinter: () => Promise<PrintResponse>;
  getPrinterStatus: () => Promise<PrinterStatusResponse>;
  passthrough: (zpl: string) => Promise<PrintResponse>;
};
