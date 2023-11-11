import type { Dayjs } from 'dayjs';

export type MoveDate = Dayjs | null;

export type Gender = 'male' | 'female' | null;

export type Post = {
  id: string;
  msg: string;
  updated_at: string;
  post_type: 'searching_for_lease' | 'offering_lease';
  duration?: {
      start?: string;
      end?: string;
  };
  price_range?: {
      low?: number;
      high?: number;
  };
  amenities?: 'parking' | 'furnished' | 'laundry' | 'AC' | 'internet' | 'common areas' | 'balcony' | 'patio' | 'yard' | 'heating' | 'smoke free' | 'cable' | 'security' | 'kitchen' | 'gym' | 'pool' | 'pets'[];
  desired_gender?: 'male' | 'female';
}
