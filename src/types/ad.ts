export type AdSettings = {
  id?: string;
  enabled: boolean;
  max_ads_per_page: number;
  home_top_code: string;
  home_middle_code: string;
  detail_top_code: string;
  detail_bottom_code: string;
  footer_code: string;
  updated_at?: string | null;
};
