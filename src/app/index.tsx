import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";

import { useOnboardingStore } from "@/store/onboardingStore";

export default function Index() {
  const { userId } = useAuth();
  const pendingSetupFor = useOnboardingStore((state) => state.pendingSetupFor);

  // An account that signed up but has not set up a card yet carries on with
  // step 2, also after a restart. Other accounts on the phone go to Home.
  if (pendingSetupFor && pendingSetupFor === userId) {
    return <Redirect href="/setup/upload" />;
  }

  return <Redirect href={"/home" as never} />;
}
