import { InformationCircleIcon, SquareLock02Icon } from "@hugeicons/core-free-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { View } from "react-native";

import { BankPicker } from "@/components/BankPicker";
import { FlowFooter, FlowScreen } from "@/components/FlowScreen";
import { InlineNote } from "@/components/InlineNote";
import { DetectedCard, FileDropzone, FileRow } from "@/components/StatementUpload";
import { MAX_STATEMENT_BYTES } from "@/data/setup";
import { track } from "@/lib/posthog";
import { statementParser } from "@/lib/statementParser";
import { useOnboardingStore } from "@/store/onboardingStore";
import type { StatementFile } from "@/types/setup";

function fileKind(name: string): StatementFile["kind"] | undefined {
  const lower = name.toLowerCase();
  return lower.endsWith(".pdf") ? "pdf" : lower.endsWith(".csv") ? "csv" : undefined;
}

// Step 2 of 3: pick the bank and the statement. The card name, last 4 digits
// and type are read from the statement, so there is no card form.
export default function Upload() {
  const router = useRouter();
  const bank = useOnboardingStore((state) => state.bank);
  const file = useOnboardingStore((state) => state.file);
  const card = useOnboardingStore((state) => state.card);
  const cardStatus = useOnboardingStore((state) => state.cardStatus);
  const setBank = useOnboardingStore((state) => state.setBank);
  const setFile = useOnboardingStore((state) => state.setFile);
  const setCard = useOnboardingStore((state) => state.setCard);
  const finishSetup = useOnboardingStore((state) => state.finishSetup);
  const [pickError, setPickError] = useState<string>();
  const [manualName, setManualName] = useState("");
  const [manualLast4, setManualLast4] = useState("");
  // Ignores a card read that finishes after the file or bank changed.
  const readId = useRef(0);

  const readCard = async (picked: StatementFile, bankName: string) => {
    const id = ++readId.current;
    setCard("reading");
    try {
      const found = await statementParser.readCard(picked, bankName);
      if (id === readId.current) {
        setCard("found", found);
      }
    } catch {
      if (id === readId.current) {
        setCard("failed");
      }
    }
  };

  const chooseBank = (name: string) => {
    setBank(name);
    if (file) {
      readCard(file, name);
    }
  };

  const pickFile = async () => {
    setPickError(undefined);
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "text/csv", "text/comma-separated-values", "application/csv"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) {
      return;
    }
    const asset = result.assets[0];
    const kind = fileKind(asset.name);
    if (!kind) {
      setPickError("Choose a PDF or CSV file.");
      return;
    }
    if ((asset.size ?? 0) > MAX_STATEMENT_BYTES) {
      setPickError("This file is over 10 MB. Export fewer months and try again.");
      return;
    }
    const picked: StatementFile = { uri: asset.uri, name: asset.name, size: asset.size ?? 0, kind };
    setManualName("");
    setManualLast4("");
    setFile(picked);
    track("statement_selected", { type: kind });
    readCard(picked, bank ?? "Other");
  };

  const removeFile = () => {
    readId.current += 1;
    setFile(undefined);
  };

  const manualReady = manualName.trim().length > 0 && /^\d{4}$/.test(manualLast4);
  const ready =
    !!bank && !!file && (cardStatus === "found" || (cardStatus === "failed" && manualReady));

  const scan = () => {
    if (cardStatus === "failed") {
      setCard("failed", { name: manualName.trim(), last4: manualLast4, type: "Debit" });
    }
    router.push("/setup/scanning");
  };

  // There is no manual add flow yet, so this leaves setup for Home.
  const addManually = () => {
    track("manual_fallback_used", { from: "upload" });
    finishSetup();
    router.dismissTo("/home");
  };

  return (
    <FlowScreen
      title="Add your card with a statement"
      subtitle="Pick your bank and upload its latest statement. We read the card name, last 4 digits and subscriptions for you."
      footer={
        <FlowFooter
          button={{ label: "Scan statement", onPress: scan, disabled: !ready }}
          link={{ label: "Add manually instead", onPress: addManually }}
        />
      }
    >
      <View className="gap-4">
        <BankPicker bank={bank} onChange={chooseBank} />
        {file ? (
          <View className="gap-2.5">
            <FileRow file={file} onRemove={removeFile} />
            <DetectedCard
              status={cardStatus === "idle" ? "reading" : cardStatus}
              card={card}
              manualName={manualName}
              manualLast4={manualLast4}
              onChangeName={setManualName}
              onChangeLast4={setManualLast4}
            />
          </View>
        ) : (
          <FileDropzone onPress={pickFile} error={pickError} />
        )}
        <View className="gap-2.5">
          <InlineNote
            icon={InformationCircleIcon}
            text="Find it in your bank app: Statements, then export the last 3 to 6 months as PDF or CSV."
          />
          <InlineNote
            icon={SquareLock02Icon}
            text="Only this card is tracked. We keep merchant, amount and date, never your full number or CVV."
          />
        </View>
      </View>
    </FlowScreen>
  );
}
