import { Delete02Icon, Image01Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react-native";
import { useRef } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Icon } from "@/components/Icon";

type PhotoAction = "choose" | "remove";

type ProfilePhotoSheetProps = {
  visible: boolean;
  hasPhoto: boolean;
  onAction: (action: PhotoAction) => void;
  onClose: () => void;
};

// "Change photo" on Profile: pick one from the library or go back to initials.
export function ProfilePhotoSheet({ visible, hasPhoto, onAction, onClose }: ProfilePhotoSheetProps) {
  // On iOS the photo library can't open while the sheet's Modal is still up, so
  // the choice runs once the sheet has fully closed.
  const pending = useRef<PhotoAction | undefined>(undefined);

  const choose = (action: PhotoAction) => {
    onClose();
    if (Platform.OS === "ios") {
      pending.current = action;
    } else {
      onAction(action);
    }
  };

  const runPending = () => {
    if (pending.current) {
      onAction(pending.current);
      pending.current = undefined;
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} onDismiss={runPending} title="Profile photo">
      <View className="mt-4 gap-2">
        <PhotoRow icon={Image01Icon} label="Choose from library" onPress={() => choose("choose")} />
        {hasPhoto && (
          <PhotoRow
            icon={Delete02Icon}
            label="Remove photo"
            destructive
            onPress={() => choose("remove")}
          />
        )}
      </View>
    </BottomSheet>
  );
}

type PhotoRowProps = {
  icon: IconSvgElement;
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

function PhotoRow({ icon, label, destructive = false, onPress }: PhotoRowProps) {
  const color = destructive ? "text-destructive" : "text-content";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-lg px-3 py-2.5 active:opacity-90"
    >
      <View className="size-10 items-center justify-center rounded-sm bg-card">
        <Icon icon={icon} size={20} className={color} />
      </View>
      <Text className={`flex-1 text-[16px] leading-[22px] font-semibold ${color}`}>{label}</Text>
    </Pressable>
  );
}
