"use client";

import React, { useEffect, useMemo, useState } from "react";
import serverCallFuction from "@/lib/constantFunction";
import { useAuth } from "@/context/AuthContext";
import Badge from "../ui/badge/Badge";

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

const AddCatalogCompo = () => {
    const { user } = useAuth();

    const userid = useMemo(() => String(((user as unknown) as { _id?: string })?._id ?? ""), [user]);

    const [catalogName, setCatalogName] = useState("");
    const [nickName, setNickName] = useState("");

    const [flattDiscount, setFlattDiscount] = useState(false);
    const [discount, setDiscount] = useState<string>("");

    const [productOptions, setProductOptions] = useState<SelectOption[]>([]);
    const [customerOptions, setCustomerOptions] = useState<SelectOption[]>([]);

    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

    // "Super admin select" checkbox (select all products/customers when enabled)
    const [superAdminSelected, setSuperAdminSelected] = useState(false);

    // React-controlled State for Nav Tabs ("products" or "customers")
    const [activeTab, setActiveTab] = useState<"products" | "customers">("products");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const catalogNameTrimmed = catalogName.trim();

    const catalogNameError = useMemo(() => {
        if (!catalogNameTrimmed) return "Catalog name is required.";
        if (typeof catalogNameTrimmed !== "string" || catalogNameTrimmed.length < 3)
            return "Catalog name must be at least 3 characters.";
        return null;
    }, [catalogNameTrimmed]);

    // Parse discount value safely for live preview calculations
    const numericDiscount = useMemo(() => {
        const val = Number(discount);
        return isNaN(val) || val <= 0 ? 0 : val;
    }, [discount]);

    useEffect(() => {
        const fetchSelectOptions = async () => {
            try {
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
                        return id ? {
                            id,
                            label: name,
                            p_gallery_image: p.p_gallery_image,
                            p_price: p.p_price,
                            price: p.price ?? p.base_price ?? p.unit_value
                        } : null;
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
                    .map((c: CustomersApiItem) => {
                        const id = String(c?._id ?? c?.id ?? "").trim();
                        const name = String(c?.full_name ?? c?.username ?? c?.email ?? id);
                        const phone = c?.phone ?? "";
                        const phoneStr = phone ? ` - ${String(phone)}` : "";
                        const label = `${name}${phoneStr}`;
                        return id ? { id, label } : null;
                    })
                    .filter(Boolean) as SelectOption[];

                setCustomerOptions(mappedCustomers);
            } catch {
                // keep options empty
            }
        };

        void fetchSelectOptions();
    }, []);

    const selectAll = () => {
        const allProductIds = productOptions.map((o) => o.id);
        const allCustomerIds = customerOptions.map((o) => o.id);

        setSelectedProductIds(allProductIds);
        setSelectedCustomerIds(allCustomerIds);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError(null);
        setSuccess(null);

        if (!userid) {
            setError("User not found. Please login again.");
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
            catalog_name: catalogNameTrimmed,
            nick_name: nickName.trim() || undefined,
            flattDiscount,
            discount: discNum,
            products: selectedProductIds.map((id) => ({ p_id: id })),
            customers: selectedCustomerIds.map((id) => ({ cus_id: id })),
        };

        setSubmitting(true);
        try {
            const res = await serverCallFuction<unknown>("POST", "api/catalog/createCatalog", body);

            const r = res as unknown as { status?: string | boolean; success?: string | boolean; message?: string };
            if (r?.status === "Success" || r?.success === "Success") {
                setSuccess(r?.message || "Catalog created successfully.");
                setCatalogName("");
                setNickName("");
                setFlattDiscount(false);
                setDiscount("");
                setSelectedProductIds([]);
                setSelectedCustomerIds([]);
                setSuperAdminSelected(false);
                return;
            }

            setError(r?.message || "Failed to create catalog.");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create catalog.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4">
            <div className="mb-4">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Add Catalog</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Create a new catalog with optional product/customer lists.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]"
            >
                {/* Catalog Name */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Catalog Name
                    </label>
                    <input
                        value={catalogName}
                        onChange={(e) => setCatalogName(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                        placeholder="e.g., FESTIVE"
                    />
                    {catalogNameError && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{catalogNameError}</p>
                    )}
                </div>

                {/* Nick Name */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Nick Name
                    </label>
                    <input
                        value={nickName}
                        onChange={(e) => setNickName(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                        placeholder="Optional"
                    />
                </div>

                {/* Discount Setup Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Discount Type
                        </label>
                        <label className="inline-flex h-10 items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={flattDiscount}
                                onChange={(e) => setFlattDiscount(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Flat Discount
                        </label>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Discount Value
                        </label>
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                            placeholder={flattDiscount ? "e.g., ₹50" : "e.g., 10%"}
                        />
                    </div>
                </div>

                {/* Global Selection Option */}
                <div>
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
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
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

                    {/* Tabs Window Content Wrapper */}
                    <div className="p-4">
                        {/* Tab Content Window 1: Products */}
                        {activeTab === "products" && (
                            <div className="max-h-64 overflow-auto">
                                {productOptions.length === 0 ? (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading products...</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {productOptions.map((opt) => {
                                            const checked = selectedProductIds.includes(opt.id);
                                            const itemImage = opt?.p_gallery_image?.[0]?.link;

                                            // Determine base price values
                                            const originalPrice = opt.p_price && opt.p_price.length > 0
                                                ? Number(opt.p_price[0].value)
                                                : Number(opt.price ?? 0);

                                            const attr = opt.p_price && opt.p_price.length > 0
                                                ? opt.p_price[0].name
                                                : "N/A";

                                            // Compute Discounted values live
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
                                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                                                                    No Img
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">{opt.label}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Attr.: {attr}</div>

                                                            {/* Live Price Calculation Block */}
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

                        {/* Tab Content Window 2: Customers */}
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

                {/* Submit Row */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? "Creating..." : "Create Catalog"}
                    </button>
                </div>

                {/* System Feedback Errors/Success */}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-200">
                        {success}
                    </div>
                )}
            </form>
        </div>
    );
};

export default AddCatalogCompo;