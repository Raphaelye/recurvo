import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from "expo-network";
import { useEffect, useState } from "react";

// Keeps the "Try again" spinner up long enough to see, so a tap while still
// offline visibly does something.
const MIN_RECHECK_MS = 600;

// Only a confirmed missing connection counts. The values are unknown before the
// first check, which counts as online so the offline state never flashes in.
// On iOS, isInternetReachable is always the same as isConnected.
function isOffline({ isConnected, isInternetReachable }: NetworkState) {
  return isConnected === false || isInternetReachable === false;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Whether the phone has no internet, kept up to date while the screen is open.
// recheck asks again straight away, for the offline state's "Try again" button.
export function useOffline() {
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getNetworkStateAsync()
      .then((state) => setOffline(isOffline(state)))
      .catch(() => {});
    const subscription = addNetworkStateListener((state) => setOffline(isOffline(state)));
    return () => subscription.remove();
  }, []);

  const recheck = async () => {
    setChecking(true);
    try {
      const [state] = await Promise.all([getNetworkStateAsync(), wait(MIN_RECHECK_MS)]);
      setOffline(isOffline(state));
    } catch {
      // Keeps the last known state.
    } finally {
      setChecking(false);
    }
  };

  return { offline, checking, recheck };
}
