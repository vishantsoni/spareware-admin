"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import serverCallFuction from '@/lib/constantFunction';
import type { ApiProduct, ApiResponse } from '@/types/product';

import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from '../tables/../ui/table';
import Badge from '../ui/badge/Badge';
import Button from '../ui/button/Button';

type ProductsApiResponse = ApiResponse<ApiProduct> | ApiProduct[] | { data?: ApiProduct[] };

type ServerFailure = {
    status: false;
    message?: string;
};

type UpdateMode = 'add' | 'remove';

// Added optional variant_id to distinctly target nested dynamic attribute rows on submission
type ProductRow = {
    id: string;
    variant_id?: string;
    name: string;
    attr_name: string;
    image: string;
    brand: string;
    inventory: number | null;
    price: string;
};

const safeString = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

const toNumberOrNull = (v: unknown): number | null => {
    if (typeof v === 'number') return Number.isNaN(v) ? null : v;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        return Number.isNaN(n) ? null : n;
    }
    return null;
};

type BadgeColor = 'success' | 'warning' | 'error';

const getInventoryBadgeColor = (n: number | null): BadgeColor => {
    if (n == null) return 'warning';
    return n <= 0 ? 'error' : 'success';
};

const IneventoryTable = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [actionLoading, setActionLoading] = useState(false);



    // Key mapped as `productID` OR `productID_variantID` to isolate individual input states safely
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const refetchProducts = async () => {
        const res = await serverCallFuction<ProductsApiResponse>(
            'GET',
            'api/product/getProducts'
        );
        const failure = res as unknown as ServerFailure;

        if (
            res &&
            typeof res === 'object' &&
            'status' in (res as object) &&
            failure.status === false
        ) {
            setError(failure.message || 'Failed to load products');
            setProducts([]);
            return;
        }

        const data = (() => {
            if (Array.isArray(res)) return res;
            const maybeObj = res as unknown as { data?: ApiProduct[] };
            if (maybeObj?.data && Array.isArray(maybeObj.data)) return maybeObj.data;
            return [];
        })();

        setProducts(data);
    };

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            try {
                setLoading(true);
                setError(null);
                await refetchProducts();
            } catch {
                // refetchProducts already sets error
            } finally {
                if (mounted) setLoading(false);
            }
        };

        run();
        return () => {
            mounted = false;
        };
    }, []);

    // --- Flattening matrix data structure logic loop ---
    const rows: ProductRow[] = useMemo(() => {
        const flatRows: ProductRow[] = [];

        products.forEach((p) => {
            const id = safeString(p._id ?? p.id ?? '');
            const image =
                (Array.isArray(p.p_gallery_image) && p.p_gallery_image[0]?.link) ||
                (Array.isArray((p as any).p_gallery) && (p as any).p_gallery?.[0]?.link) ||
                p.f_image ||
                (p.image ?? '') ||
                '';
            const brand = safeString(p.brand ?? '');
            const baseName = safeString(p.p_name ?? p.name ?? '-');

            const pPriceArray = Array.isArray(p.p_price) ? p.p_price : [];

            if (pPriceArray.length > 0) {
                // If sub-attributes exist, treat each item as an independent product row
                pPriceArray.forEach((attr: any) => {
                    flatRows.push({
                        id,
                        variant_id: attr._id,
                        name: `${baseName} - (${attr.name || 'Attribute'})`,
                        attr_name: attr.name,
                        image,
                        brand,
                        inventory: toNumberOrNull(attr.inventory),
                        price: safeString(attr.value ?? ''),
                    });
                });
            } else {
                // Fallback to primary product tracking fields if p_price array wrapper is empty
                flatRows.push({
                    id,
                    name: baseName,
                    attr_name: "N/A",
                    image,
                    brand,
                    inventory: toNumberOrNull(p.inventory),
                    price: safeString(p.price ?? ''),
                });
            }
        });

        return flatRows;
    }, [products]);


    console.log("ros - ", rows);


    const handleUpdate = async (productId: string, variantId?: string, mode?: string) => {
        const inputKey = variantId ? `${productId}_${variantId}` : productId;
        const quantity = quantities[inputKey];

        if (!productId) return;
        if (quantity == null || Number.isNaN(quantity) || quantity <= 0) return;

        try {
            setActionLoading(true);
            setError(null);

            const res = await serverCallFuction<unknown>(
                'POST',
                `api/inventory/updateInventory/${mode}`,
                {
                    p_id: productId,
                    attr_id: variantId || undefined, // Sends variant identifier context safely if present
                    inventory: quantity,
                }
            );

            const failure = res as unknown as ServerFailure;
            if (
                res &&
                typeof res === 'object' &&
                'status' in (res as object) &&
                failure.status === false
            ) {
                setError(failure.message || 'Failed to update inventory');
                return;
            }

            await refetchProducts();
            setQuantities((prev) => {
                const next = { ...prev };
                delete next[inputKey];
                return next;
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to update inventory';
            setError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-3">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
                </div>

                {/* <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] px-3 py-2">
                        <button
                            type="button"
                            className={mode === 'add' ? 'text-theme-600 font-semibold' : 'text-gray-600 font-medium hover:text-gray-900'}
                            onClick={() => setMode('add')}
                            disabled={actionLoading}
                        >
                            Add
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            type="button"
                            className={mode === 'remove' ? 'text-theme-600 font-semibold' : 'text-gray-600 font-medium hover:text-gray-900'}
                            onClick={() => setMode('remove')}
                            disabled={actionLoading}
                        >
                            Remove
                        </button>
                    </div>
                </div> */}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                    <div className="min-w-[900px]">
                        {loading ? (
                            <div className="p-6 text-gray-500 text-sm">Loading inventory...</div>
                        ) : error ? (
                            <div className="p-6 text-error-600 text-sm">{error}</div>
                        ) : (
                            <Table>
                                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                    <TableRow>
                                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400">Image</TableCell>
                                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400">Product</TableCell>
                                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400">Attribute</TableCell>
                                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400">Current inventory</TableCell>
                                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400">Quantity</TableCell>
                                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400">Action</TableCell>
                                    </TableRow>
                                </TableHeader>

                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell className="px-5 py-4 text-gray-500 text-sm" colSpan={5}>No products found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((r, idx) => {
                                            // Unique key string generation using variant_id fallback tracking token
                                            const uniqueRowKey = r.variant_id ? `${r.id}_${r.variant_id}` : r.id;
                                            const qty = quantities[uniqueRowKey];
                                            const current = r.inventory;
                                            const disabled = actionLoading || qty == null || Number.isNaN(qty) || qty <= 0;

                                            return (
                                                <TableRow key={`${uniqueRowKey}-${idx}`}>
                                                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                        <div className="w-12 h-12 overflow-hidden rounded-lg bg-gray-50 dark:bg-white/[0.03]">
                                                            {r.image ? (
                                                                <Image width={48} height={48} src={r.image} alt={r.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full" />
                                                            )}
                                                        </div>
                                                    </TableCell>



                                                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-800 dark:text-white/90">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-medium max-w-[280px]">{r.name}</span>
                                                            {r.brand && (
                                                                <div className="flex gap-2">
                                                                    <Badge variant="light">{r.brand}</Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-800 dark:text-white/90">
                                                        <Badge variant='solid' color={'info'} className="font-medium max-w-[280px]">{r.attr_name}</Badge>
                                                    </TableCell>

                                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                        <Badge variant="solid" color={getInventoryBadgeColor(current)}>
                                                            {current == null ? '-' : current}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            step={1}
                                                            value={qty ?? ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const n = value === '' ? undefined : Number(value);
                                                                setQuantities((prev) => ({
                                                                    ...prev,
                                                                    [uniqueRowKey]: n as number,
                                                                }));
                                                            }}
                                                            className="w-28 rounded-md border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 outline-none focus:border-theme-500"
                                                            placeholder="0"
                                                            disabled={actionLoading}
                                                        />
                                                    </TableCell>

                                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                onClick={() => {
                                                                    let mode = ''
                                                                    if (r.variant_id) {
                                                                        mode = 'attr'
                                                                    }

                                                                    void handleUpdate(r.id, r.variant_id, mode)
                                                                }}
                                                                disabled={disabled}
                                                            >
                                                                {actionLoading ? 'Updating...' : 'Add'}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default IneventoryTable;