import ExpoZebraPrintConnect, {
  PrinterStatusResponse,
  PrintResponse,
  PrintResponseWithData,
} from "expo-zebra-print-connect";
import { useState } from "react";
import {
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";

const StatusIndicator = ({
  label,
  value,
  isPositive = false,
}: {
  label: string;
  value: string;
  isPositive?: boolean;
}) => {
  const isTrue = value.toLowerCase() === "true";
  const shouldBeGreen = isPositive ? isTrue : !isTrue;

  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}:</Text>
      <View
        style={[
          styles.statusIndicator,
          { backgroundColor: shouldBeGreen ? "#4CAF50" : "#F44336" },
        ]}
      >
        <Text style={styles.statusValue}>{isTrue ? "Yes" : "No"}</Text>
      </View>
    </View>
  );
};

const PrinterStatusView = ({
  status,
}: {
  status: NonNullable<PrinterStatusResponse["data"]>;
}) => {
  return (
    <View style={styles.statusContainer}>
      <Text style={styles.statusTitle}>Printer Status</Text>

      <View style={styles.printerInfo}>
        <Text style={styles.printerName}>{status.friendlyName}</Text>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.sectionHeader}>System</Text>
        <StatusIndicator
          label="Ready to Print"
          value={status.isReadyToPrint}
          isPositive={true}
        />
        <StatusIndicator label="Paused" value={status.isPaused} />
        <StatusIndicator
          label="Partial Format"
          value={status.isPartialFormatInProgress}
        />
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.sectionHeader}>Hardware</Text>
        <StatusIndicator label="Head Cold" value={status.isHeadCold} />
        <StatusIndicator label="Head Open" value={status.isHeadOpen} />
        <StatusIndicator label="Head Hot" value={status.isHeadTooHot} />
        <StatusIndicator label="Paper Out" value={status.isPaperOut} />
        <StatusIndicator label="Ribbon Out" value={status.isRibbonOut} />
        <StatusIndicator
          label="Buffer Full"
          value={status.isReceiveBufferFull}
        />
      </View>
    </View>
  );
};

const ActionButton = ({
  title,
  onPress,
  onError,
  onResponse,
}: {
  title: string;
  onPress: () => Promise<PrintResponse>;
  onError: (error: Error) => void;
  onResponse: (response: PrintResponseWithData) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <View style={styles.buttonContainer}>
      <Button
        title={isLoading ? "Loading..." : title}
        onPress={async () => {
          try {
            setIsLoading(true);
            const response = await onPress();
            onResponse(response);
          } catch (error) {
            onError(error as Error);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
        color="#007AFF"
      />
    </View>
  );
};

export default function App() {
  const [response, setResponse] = useState<string | null>(null);
  const [printerStatus, setPrinterStatus] = useState<
    PrinterStatusResponse["data"] | null
  >(null);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Zebra Print Connect</Text>
          <Text style={styles.subtitle}>Module API Example</Text>
        </View>

        <View style={styles.buttonSection}>
          <ActionButton
            title="Get Printer Status"
            onPress={ExpoZebraPrintConnect.getPrinterStatus}
            onError={(error) => console.error(error)}
            onResponse={(response) => {
              setPrinterStatus(null);
              setResponse(response.message);

              if (response.data) {
                setPrinterStatus(
                  response.data as PrinterStatusResponse["data"]
                );
              }
            }}
          />
          <ActionButton
            title="Unselect Printer"
            onPress={ExpoZebraPrintConnect.unselectPrinter}
            onError={(error) => console.error(error)}
            onResponse={(response) => {
              setResponse(response.message);
              setPrinterStatus(null);
            }}
          />
          <ActionButton
            title="Print Test Label"
            onPress={() =>
              ExpoZebraPrintConnect.print(
                // 2" x 4" label, centered "Hello, World!"
                "^XA" +
                  "^PW812" + // Set label width to 812 dots (4 inches at 203 dpi)
                  "^LL406" + // Set label length to 406 dots (2 inches at 203 dpi)
                  "^CI28" + // Use UTF-8 encoding (optional, for international chars)
                  "^FO0,153" + // Field origin: x=0 (left), y=153 (centered vertically for 100pt font)
                  "^FB812,1,0,C,0" + // Field block: width=812, 1 line, center justification
                  "^A0N,100,100" + // Font 0, normal orientation, 100pt height, 100pt width
                  "^FDHello, World!^FS" + // Field data
                  "^XZ"
              )
            }
            onError={(error) => console.error(error)}
            onResponse={(response) => setResponse(response.message)}
          />
        </View>

        {printerStatus && <PrinterStatusView status={printerStatus} />}

        {response && !printerStatus && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>Response:</Text>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  buttonSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  buttonContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  printerInfo: {
    backgroundColor: "#F0F8FF",
    padding: 6,
    borderRadius: 4,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  printerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
  },
  statusSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statusLabel: {
    fontSize: 12,
    color: "#333333",
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 32,
    alignItems: "center",
  },
  statusValue: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  responseContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
});
