"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Badge from "../ui/badge/Badge";

import serverCallFuction from "@/lib/constantFunction";
import { useAuth } from "@/context/AuthContext";

import type { Catalog, CatalogApiResponse, ServerFailure } from "@/components/catalog/catalogTypes";
type UpdateResponse = {
    status?: boolean | string;
    success?: boolean | string;
    message?: string;
};

type CatalogCreateBody = {
    userid: string;
    catalog_name: string;
    nick_name?: string;
    flattDiscount: boolean;
    discount?: number;
    products: { p_id?: string }[];
    customers: { cus_id?: string }[];
};

type SelectOption = {
    id: string;
    label: string;
    p_gallery_image?: { link: string }[];
    p_price?: { name: string; value: number | string }[];
    price?: number | string;
};

type ProductsApiItem = {
    _id?: string;
    id?: string;
    p_name?: string;
    name?: string;
    title?: string;
    base_price?: string | number;
    unit_value?: number;
    p_gallery_image?: { link: string }[];
    p_price?: { name: string; value: number | string }[];
    price?: number | string;
};

type CustomersApiItem = {
    _id?: string;
    id?: string;
    full_name?: string;
    username?: string;
    email?: string;
    phone?: string | number;
};

const UpdateCatalogCompo = () => {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const catalogId = useMemo(() => String(params?.id ?? ""), [params]);
    const userid = useMemo(
        () =>
            String(
                ((user as unknown) as { _id?: string })?._id ?? ""
            ),
        [user]
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [catalogName, setCatalogName] = useState("");
    const [nickName, setNickName] = useState("");

    const [flattDiscount, setFlattDiscount] = useState(false);
    const [discount, setDiscount] = useState<string>("");

    const [productOptions, setProductOptions] = useState<SelectOption[]>([]);
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>([]);

    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

    const [superAdminSelected, setSuperAdminSelected] = useState(false);
    const [activeTab, setActiveTab] = useState<"products" | "customers">("products");

    const fetchSelectOptions = async () => {
        const productsRes = await serverCallFuction<unknown>("GET", "api/product/getProducts");
        const productsList: ProductsApiItem[] = (() => {
            if (Array.isArray(productsRes)) return productsRes as ProductsApiItem[];
            const maybe = productsRes as { data?: ProductsApiItem[] };
            if (Array.isArray(maybe?.data)) return maybe.data as ProductsApiItem[];
            const maybe2 = productsRes as { data?: { data?: ProductsApiItem[] } };
            if (Array.isArray(maybe2?.data?.data)) return maybe2.data.data as ProductsApiItem[];
            return [];
        })();

        const mappedProducts: SelectOption[] = productsList
            .map((p) => {
                const id = String(p?._id ?? p?.id ?? "").trim();
                const name = String(p?.p_name ?? p?.name ?? p?.title ?? id);
                return id
                    ? {
                        id,
                        label: name,
                        p_gallery_image: p.p_gallery_image,
                        p_price: p.p_price,
                        price: (p as ProductsApiItem).price ?? p.base_price ?? p.unit_value
                    }
                    : null;
            })
            .filter(Boolean) as SelectOption[];

        setProductOptions(mappedProducts);

        const customersRes = await serverCallFuction<unknown>("GET", "api/customer/getCustomers");
        const customersList: CustomersApiItem[] = (() => {
            if (Array.isArray(customersRes)) return customersRes as CustomersApiItem[];
            const maybe = customersRes as { data?: CustomersApiItem[] };
            if (Array.isArray(maybe?.data)) return maybe.data as CustomersApiItem[];
            const maybe2 = customersRes as { customers?: CustomersApiItem[] };
            if (Array.isArray(maybe2?.customers)) return maybe2.customers as CustomersApiItem[];
            return [];
        })();

        const mappedCustomers: SelectOption[] = customersList
            .map((c) => {
                const id = String(c?._id ?? c?.id ?? "").trim();
                const name = String(c?.full_name ?? c?.username ?? c?.email ?? id);
                const phone = c?.phone ?? "";
                const phoneStr = phone ? ` - ${String(phone)}` : "";
                const label = `${name}${phoneStr}`;
                return id ? { id, label } : null;
            })
            .filter(Boolean) as SelectOption[];

        setCustomerOptions(mappedCustomers);
    };

    const selectAll = () => {
        const allProductIds = productOptions.map((o) => o.id);
        const allCustomerIds = customerOptions.map((o) => o.id);

        setSelectedProductIds(allProductIds);
        setSelectedCustomerIds(allCustomerIds);
    };

    const fetchAndFill = async () => {
        const res = await serverCallFuction<CatalogApiResponse | Catalog[]>(
            "GET",
            "api/catalog/getCatalog"
        );

        const failure = res as unknown as ServerFailure;
        if (
            res &&
            typeof res === "object" &&
            "status" in (res as object) &&
            failure.status === false
        ) {
            setError(failure.message || "Failed to load catalog");
            return;
        }

        const list = (() => {
            if (Array.isArray(res)) return res as Catalog[];
            const r = res as CatalogApiResponse;
            if (Array.isArray(r?.data)) return r.data as Catalog[];
            if (Array.isArray(r?.catalogs)) return r.catalogs as Catalog[];
            return [];
        })();

        const found = list.find((c) => String(c._id ?? "") === catalogId);
        if (!found) {
            setError("Catalog not found.");
            return;
        }

        setCatalogName(found.catalog_name ?? "");
        setNickName(found.nick_name ?? "");
        setFlattDiscount(!!found.flattDiscount);
        setDiscount(found.discount != null ? String(found.discount) : "");

        const productIds = (found.products ?? []).map((p) => p.p_id).filter(Boolean);
        const customerIds = (found.customers ?? []).map((c) => c.cus_id).filter(Boolean);

        setSelectedProductIds(productIds as string[]);
        setSelectedCustomerIds(customerIds as string[]);

        // If catalog already contains all products/customers, reflect it in the UI.
        const allProductIds = productOptions.map((o) => o.id);
        const allCustomerIds = customerOptions.map((o) => o.id);
        const allProductsSelected = allProductIds.length > 0 && productIds.length === allProductIds.length;
        const allCustomersSelected = allCustomerIds.length > 0 && customerIds.length === allCustomerIds.length;
        if (allProductsSelected && allCustomersSelected) {
            setSuperAdminSelected(true);
        }
    };

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            try {
                setLoading(true);
                setError(null);
                await fetchSelectOptions();
                await fetchAndFill();
            } catch (e: unknown) {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : "Failed to load catalog");
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };

        if (catalogId) void run();

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalogId]);

    const catalogNameTrimmed = catalogName.trim();
    const catalogNameError = useMemo(() => {
        if (!catalogNameTrimmed) return "Catalog name is required.";
        if (typeof catalogNameTrimmed !== "string" || catalogNameTrimmed.length < 3) {
            return "Catalog name must be at least 3 characters.";
        }
        return null;
    }, [catalogNameTrimmed]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);


        if (!userid) {
            setError("User not found. Please login again.");
            return;
        }

        if (!catalogId) {
            setError("Missing catalog id.");
            return;
        }

        if (catalogNameError) {
            setError(catalogNameError);
            return;
        }

        const discNum = discount.trim() ? Number(discount) : undefined;
        if (discount.trim() && Number.isNaN(discNum)) {
            setError("Discount must be a number.");
            return;
        }

        const body: CatalogCreateBody = {
            userid,
            catalog_id: catalogId,
            catalog_name: catalogNameTrimmed,
            nick_name: nickName.trim() || undefined,
            flattDiscount,
            discount: discNum,
            products: selectedProductIds.map((id) => ({ p_id: id })),
            customers: selectedCustomerIds.map((id) => ({ cus_id: id })),
        } as unknown as CatalogCreateBody;

        try {
            setSaving(true);
            const res = await serverCallFuction<UpdateResponse>(
                "PUT",
                `api/catalog/updateCatalog/${catalogId}`,
                body
            );

            const r = res as unknown as UpdateResponse;
            const statusOk = r?.status === "Sucess" || r?.success === "Success";

            if (
                res &&
                typeof res === "object" &&
                "status" in (res as object) &&
                (res as { status?: boolean }).status === false
            ) {
                setError((r?.message as string) || "Failed to update catalog");
                return;
            }

            if (statusOk) {
                router.push("/catalog");
                return;
            }

            setError(r?.message || "Failed to update catalog");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update catalog");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4">
            <div className="mb-4">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                    Edit Catalog
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Update catalog details.
                </p>
            </div>

            {loading ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
                    Loading catalog...
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]"
                >
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Catalog Name
                        </label>
                        <input
                            value={catalogName}
                            onChange={(e) => setCatalogName(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                        />
                        {catalogNameError && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {catalogNameError}
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Nick Name
                        </label>
                        <input
                            value={nickName}
                            onChange={(e) => setNickName(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Discount Type
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={flattDiscount}
                                onChange={(e) => setFlattDiscount(e.target.checked)}
                            />
                            Flat Discount
                        </label>
                    </div>

                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Discount Value
                        </label>
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                        />
                    </div>

                    {/* Global Selection Option */}
                    <div className="mb-4">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={superAdminSelected}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSuperAdminSelected(checked);
                                    if (checked) {
                                        selectAll();
                                    } else {
                                        setSelectedProductIds([]);
                                        setSelectedCustomerIds([]);
                                    }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Super admin select (all products & customers)
                        </label>
                    </div>

                    {/* Tailwind Nav Tabs Container */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] mb-4">
                        {/* Tab Selection Row */}
                        <div className="border-b border-gray-200 bg-gray-50/50 px-4 pt-2 dark:border-white/[0.05] dark:bg-white/[0.01]">
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("products")}
                                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "products"
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        }`}
                                >
                                    Products ({selectedProductIds.length}/{productOptions.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("customers")}
                                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "customers"
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        }`}
                                >
                                    Customers ({selectedCustomerIds.length}/{customerOptions.length})
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            {activeTab === "products" && (
                                <div className="max-h-64 overflow-auto">
                                    {productOptions.length === 0 ? (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Loading products...</div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {productOptions.map((opt) => {
                                                const checked = selectedProductIds.includes(opt.id);
                                                const itemImage = opt?.p_gallery_image?.[0]?.link;

                                                const numericDiscount = (() => {
                                                    const val = Number(discount);
                                                    return isNaN(val) || val <= 0 ? 0 : val;
                                                })();

                                                const originalPrice = opt.p_price && opt.p_price.length > 0
                                                    ? Number(opt.p_price[0].value)
                                                    : Number(opt.price ?? 0);

                                                const attr = opt.p_price && opt.p_price.length > 0 ? opt.p_price[0].name : "N/A";

                                                const discountedPrice = flattDiscount
                                                    ? Math.max(0, originalPrice - numericDiscount)
                                                    : Math.max(0, originalPrice * (1 - numericDiscount / 100));

                                                const hasActiveDiscount = numericDiscount > 0;

                                                return (
                                                    <div key={opt.id} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/[0.05] dark:bg-black/20">
                                                        <label className="flex cursor-pointer items-start gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                disabled={superAdminSelected}
                                                                onChange={(e) => {
                                                                    const isChecked = e.target.checked;
                                                                    setSelectedProductIds((prev) => {
                                                                        if (isChecked) return Array.from(new Set([...prev, opt.id]));
                                                                        return prev.filter((id) => id !== opt.id);
                                                                    });
                                                                }}
                                                                className="mt-1 rounded text-blue-600"
                                                            />

                                                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800">
                                                                {itemImage ? (
                                                                    <img
                                                                        src={itemImage}
                                                                        alt={opt.label}
                                                                        className="h-full w-full object-cover"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image";
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                                                                        No Img
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
                                                                    {opt.label}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">Attr.: {attr}</div>

                                                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                                                                    <span className="text-gray-500 dark:text-gray-400">Price:</span>
                                                                    {hasActiveDiscount ? (
                                                                        <>
                                                                            <span className="line-through text-gray-400 dark:text-gray-500 font-medium">
                                                                                ₹{originalPrice.toFixed(2)}
                                                                            </span>
                                                                            <Badge variant="solid" size="md" className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                                ₹{discountedPrice.toFixed(2)}
                                                                            </Badge>
                                                                        </>
                                                                    ) : (
                                                                        <Badge size="md" color="success" className="font-bold ">
                                                                            ₹{originalPrice.toFixed(2)}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "customers" && (
                                <div className="max-h-64 overflow-auto">
                                    {customerOptions.length === 0 ? (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Loading customers...</div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {customerOptions.map((opt) => {
                                                const checked = selectedCustomerIds.includes(opt.id);
                                                return (
                                                    <div key={opt.id} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/[0.05] dark:bg-black/20">
                                                        <label className="flex cursor-pointer items-start gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                disabled={superAdminSelected}
                                                                onChange={(e) => {
                                                                    const isChecked = e.target.checked;
                                                                    setSelectedCustomerIds((prev) => {
                                                                        if (isChecked) return Array.from(new Set([...prev, opt.id]));
                                                                        return prev.filter((id) => id !== opt.id);
                                                                    });
                                                                }}
                                                                className="mt-1 rounded text-blue-600"
                                                            />
                                                            <div>
                                                                <div className="text-sm font-semibold text-gray-900 dark:text-white/90">{opt.label}</div>
                                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">ID: {opt.id}</div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/catalog")}
                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-200"
                        >
                            Cancel
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200">
                            {error}
                        </div>
                    )}
                </form>
            )}
        </div>
    );
};

export default UpdateCatalogCompo;

