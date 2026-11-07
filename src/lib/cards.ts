import type { PaymentCard } from "@/types/setup";

// Two cards with the same name and last 4 digits are the same card.
export const cardKey = (card: PaymentCard) => `${card.name}-${card.last4}`;

// Each card once, in the order first seen.
export function uniqueCards(cards: PaymentCard[]) {
  return [...new Map(cards.map((card) => [cardKey(card), card])).values()];
}
