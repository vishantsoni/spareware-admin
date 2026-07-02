export interface Category {
  id: number;
  name: string;
  slug?: string;
  parent_id: number | null;
}

export interface Tax {
  id: number;
  tax_name: string;
  tax_percentage:string;
}

export interface AttributeValue {
  id: string;
  attr_id: string;
  value: string;
}

export interface Variant {
  id?: string;
  sku: string;
  price: string;
  bv_point: number;
  stock: number;
  image?: string | File | null;
  attr_mappings: Array<{ attr_id: string; value_id: string }>;
}

// NOTE: `GET api/product/getProducts` returns a different product shape than this legacy model.
// This file now includes a minimal, API-aligned subset used by the admin Products table.

export interface ApiProductCategoryRef {
  _id: string;
  userid?: string;
  cat_name?: string;
  sub_items?: Array<{
    _id: string;
    model_name?: string;
    years?: Array<{
      _id: string;
      year_val: number;
      variants?: Array<{
        _id: string;
        variant_name?: string;
      }>;
    }>;
  }>;
  createdAt?: string;
}

export interface ApiProduct {
  _id?: string;
  id?: number;

  // core product identity
  p_name?: string;
  name?: string;
  brand?: string;
  model_name?: string;
  year_val?: number;
  variant_name?: string;

  // categorization
  cat_id?: string | ApiProductCategoryRef;
  category_name?: string;

  // pricing / inventory
  price?: number;
  base_price?: string | number;
  unit_value?: number;
  inventory?: number;
  hide_inventory?: boolean;

  // status / visibility
  visibility?: boolean;
  status?: 'active' | 'inactive' | 'trash' | string;

  // misc
  location?: string;
  p_sku?: string;
  p_gallery_image?: Array<{ link?: string }>;
  p_gallery?: Array<{ link?: string }>;
  p_gallery_video?: string;

  // allow response field spelling variants
  short_description?: string;
  description?: string;

  // per pcs / p_price pricing rows
  p_price?: Array<{ inventory?: string; name?: string; value?: string }>;

  // used by image column in table
  f_image?: string;
  g_image?: string[];
  image?: string;
}

export interface Product {
  // Legacy fields kept for compatibility with other codepaths.
  id: number;
  name: string;
  slug?: string;
  description?: string;
  base_price: string;
  discounted_price?: number;
  cat_id: string;
  category?: Category;
  category_name?: string;
  subcategories?: string[];
  attributes?: string[];
  variants: Variant[];
  variant_count: number;
  f_image: string;
  g_image: string[];
  status: 'active' | 'inactive' | 'trash';
  tax_id: string;
  tax?: Tax;
  created_at: string;
  updated_at?: string;
  tax_data?: {
    name?: string;
    percentage?: number;
    id?: number;
  } | null;
}


export interface ApiResponse<T> {
  status?: boolean;
  success: boolean;
  data?: T[];
  message?: string;
}

