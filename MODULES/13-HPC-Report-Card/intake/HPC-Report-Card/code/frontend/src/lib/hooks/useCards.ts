import { useAsync } from './useAsync';
import { cardService } from '@/lib/services/card.service';

export function useRecentCards(limit = 10) {
  return useAsync(() => cardService.getRecent(limit), [limit]);
}

export function useCard(cardId: string) {
  return useAsync(() => cardService.getById(cardId), [cardId], {
    enabled: Boolean(cardId),
  });
}
