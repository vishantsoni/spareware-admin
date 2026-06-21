export type VariantCreate = {
  variant_name: string;
  created?: string | Date;
};

export type YearCreate = {
  year_val: number;
  variants: VariantCreate[];
};

export type CategoryCreateSubItem = {
  model_name: string;
  years: YearCreate[];
};


