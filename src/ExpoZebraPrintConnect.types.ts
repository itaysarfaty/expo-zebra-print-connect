export interface PrintResponse {
  success: boolean;
  message: string;
}
export interface PrintResponseWithData<T = any> extends PrintResponse {
  data?: T;
}

// Specific printer status data structure
export interface PrinterStatusData {
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

// Enhanced printer status response
export interface PrinterStatusResponse
  extends PrintResponseWithData<PrinterStatusData> {}

export type PrintConnectActions = {
  unselectPrinter: () => Promise<PrintResponse>;
  getPrinterStatus: () => Promise<PrinterStatusResponse>;
  passthrough: (zpl: string) => Promise<PrintResponse>;
};
