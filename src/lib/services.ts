import { serviceCategories } from "@/data/serviceCategories";
import { serviceNames } from "@/data/serviceNames";
import type { ServiceCategory } from "@/types/subscription";

// True for "Spotify" and longer statement names such as "Spotify Family".
function startsWithService(name: string, service: string) {
  const key = name.trim().toLowerCase();
  const known = service.toLowerCase();
  return key === known || key.startsWith(`${known} `);
}

// The category shown under a subscription's name. Anything unknown is "Other".
export function categoryOf(name: string): ServiceCategory {
  const service = Object.keys(serviceCategories).find((known) => startsWithService(name, known));
  return service ? serviceCategories[service] : "Other";
}

// Who to cancel with: "DStv Compact" → "DStv". An unknown name is its own provider.
export function providerOf(name: string) {
  return serviceNames.find((service) => startsWithService(name, service)) ?? name.trim();
}
