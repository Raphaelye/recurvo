import { Alert } from "react-native";

// Saves one account's changes to Supabase one after another, so a change never
// starts from data another change is still saving. Stores make a new queue
// whenever the signed-in account changes.
export function createSaveQueue() {
  let last: Promise<unknown> = Promise.resolve();
  // Saves queued or running, and a count that moves whenever one starts or ends.
  let waiting = 0;
  let version = 0;

  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      waiting += 1;
      version += 1;
      const next = last.then(task, task).finally(() => {
        waiting -= 1;
        version += 1;
      });
      last = next.catch(() => undefined);
      return next;
    },
    // A refresh from Supabase notes the version when it starts, and only shows
    // what it loaded if no save ran meanwhile. So it never undoes a change that
    // was still being saved; the next refresh picks that change up.
    version: () => version,
    quietSince: (start: number) => waiting === 0 && version === start,
  };
}

let alertOpen = false;

// Shown when Supabase can't save a change, after the change has been undone.
// Only one at a time, even when several saves fail together offline.
export function alertSaveFailed() {
  if (alertOpen) {
    return;
  }
  alertOpen = true;
  Alert.alert("Couldn’t save your change", "Check your connection and try again.", [
    {
      text: "OK",
      onPress: () => {
        alertOpen = false;
      },
    },
  ]);
}
