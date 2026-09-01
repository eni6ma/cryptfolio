import { SubscriptionOffer, UserSettings } from '@cryptfolio/common/interfaces';
import { SubscriptionType } from '@cryptfolio/common/types';

import { Access, Account, Settings, User } from '@prisma/client';

// TODO: Compare with User interface
export type UserWithSettings = User & {
  accessesGet: Access[];
  accounts: Account[];
  activityCount: number;
  dataProviderCryptfolioDailyRequests: number;
  permissions?: string[];
  settings: Settings & { settings: UserSettings };
  subscription?: {
    expiresAt?: Date;
    offer: SubscriptionOffer;
    type: SubscriptionType;
  };
};
