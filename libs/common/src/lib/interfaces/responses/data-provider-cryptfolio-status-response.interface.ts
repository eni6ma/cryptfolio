import { UserWithSettings } from '@cryptfolio/common/types';

export interface DataProviderCryptfolioStatusResponse {
  dailyRequests: number;
  dailyRequestsMax: number;
  subscription: UserWithSettings['subscription'];
}
