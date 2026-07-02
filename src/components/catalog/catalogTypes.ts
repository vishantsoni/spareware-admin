export type Catalog = {
  _id?: string;
  userid?: string;
  catalog_name?: string;
  nick_name?: string;
  products?: { p_id: string }[];
  customers?: { cus_id: string }[];
  flattDiscount?: boolean;
  discount?: number;
  createdAt?: string;
};

export type CatalogApiResponse = {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: Catalog[];
  catalogs?: Catalog[];
};

export type ServerFailure = {
  status: false;
  message?: string;
};

