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

type ProductRow = {
    id: string;
    name: string;
    category: string;
    basePrice: string | number;
    status: string;
    statusBadgeColor: 'success' | 'warning' | 'error';
    image: string;

    // extra columns
    brand: string;
    sku: string;
    year: string;
    variant: string;
    location: string;
    inventory: string;
    stockStatus: 'in_stock' | 'out_of_stock';
};


const safeString = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

const ProductTable: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    const refetchProducts = async () => {
        const res = await serverCallFuction<ProductsApiResponse>('GET', 'api/product/getProducts');
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

    const handleDelete = async (productId: string) => {
        if (!productId) return;

        try {
            setActionLoading(true);

            const res = await serverCallFuction(
                'DELETE',
                `api/product/deleteProduct/${productId}`
            );

            const failure = res as unknown as ServerFailure;
            if (
                res &&
                typeof res === 'object' &&
                'status' in (res as object) &&
                failure.status === false
            ) {
                setError(failure.message || 'Failed to delete product');
                return;
            }

            setError(null);
            await refetchProducts();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to delete product';
            setError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleOutOfStockToggle = async (productId: string, type: 'show' | 'hide') => {
        if (!productId) return;

        try {
            setActionLoading(true);

            const res = await serverCallFuction(
                'PUT',
                `api/product/outofstock/${productId}/${type}`
            );

            const failure = res as unknown as ServerFailure;
            if (
                res &&
                typeof res === 'object' &&
                'status' in (res as object) &&
                failure.status === false
            ) {
                setError(failure.message || 'Failed to update stock');
                return;
            }

            setError(null);
            await refetchProducts();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to update stock';
            setError(msg);
        } finally {
            setActionLoading(false);
        }
    };


    const rows: ProductRow[] = useMemo(() => {
        return products.map((p) => {
            const status = safeString(p.status || (p.visibility ? 'active' : 'inactive'));

            // p_price (per pcs pricing rows) - show first row value in Base Price column fallback
            const firstPPrice = Array.isArray(p.p_price) ? p.p_price?.[0] : undefined;
            const pPriceValue =
                firstPPrice && (typeof firstPPrice.value === 'string' || typeof firstPPrice.value === 'number')
                    ? firstPPrice.value
                    : undefined;


            const statusBadgeColor: 'success' | 'warning' | 'error' =
                status === 'active'
                    ? 'success'
                    : status === 'inactive'
                        ? 'warning'
                        : 'error';

            const category =
                (typeof p.category_name === 'string' ? p.category_name : undefined) ??
                (typeof (p.cat_id as { cat_name?: string } | undefined)?.cat_name === 'string'
                    ? (p.cat_id as { cat_name?: string }).cat_name
                    : undefined) ??
                '-';


            // API sample shows: price: 120, base_price not present
            const basePrice =
                (p.base_price ?? (p as { price?: number | string }).price ?? p.unit_value ?? pPriceValue ?? '') as string | number;


            const image =
                (Array.isArray(p.p_gallery_image) && p.p_gallery_image[0]?.link) ||
                (Array.isArray((p as { p_gallery?: Array<{ link?: string }> }).p_gallery) &&
                    (p as { p_gallery?: Array<{ link?: string }> }).p_gallery?.[0]?.link) ||
                p.f_image ||
                p.image ||
                '';


            const id = safeString(p._id ?? p.id ?? '');
            const name = safeString(p.p_name ?? p.name ?? '-');

            const brand = safeString(p.brand ?? '');
            const sku = safeString(p.p_sku ?? '');

            const year = typeof p.year_val === 'number' ? String(p.year_val) : safeString(p.year_val ?? '');
            const variant = safeString(p.variant_name ?? '');

            const location = safeString(p.location ?? '');
            const inventoryNum = typeof p.inventory === 'number' ? p.inventory : p.inventory == null ? null : Number(p.inventory);
            const stockStatus: 'in_stock' | 'out_of_stock' =
                inventoryNum != null && !Number.isNaN(inventoryNum) && inventoryNum <= 0
                    ? 'out_of_stock' : p.hide_inventory ? 'out_of_stock'
                        : 'in_stock';
            const inventory = p.inventory == null ? '' : String(p.inventory);

            return {
                id,
                name,
                category,
                basePrice,
                status,
                statusBadgeColor,
                image,
                p_price: p.p_price,
                brand,
                sku,
                year,
                variant,
                location,
                inventory,
                stockStatus,
            };

        });
    }, [products]);

    return (
        <>
            <div className='flex items-center justify-between mb-3'>
                <div className='mb-4'>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product List</h1>
                    {/* <p className="text-gray-500 dark:text-gray-400">Manage your downline members and their details</p> */}
                </div>

                <Button onClick={() => navigation.navigate("/products/add")}>Add New Product</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">

                <div className="max-w-full overflow-x-auto">
                    <div className="min-w-[1102px]">
                        {loading ? (
                            <div className="p-6 text-gray-500 text-sm">Loading products...</div>
                        ) : error ? (
                            <div className="p-6 text-error-600 text-sm">{error}</div>
                        ) : (
                            <Table>
                                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                    <TableRow>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Image
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Name
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Category/ Year/ Variant
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Base Price
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Status
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Location
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Inventory
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Stock
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Actions
                                        </TableCell>

                                    </TableRow>
                                </TableHeader>


                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell className="px-5 py-4 text-gray-500 text-sm" colSpan={13}>
                                                No products found.
                                            </TableCell>
                                        </TableRow>

                                    ) : (
                                        rows.map((r) => (
                                            <TableRow key={r.id || r.name}>
                                                <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                    <div className="w-12 h-12 overflow-hidden rounded-lg bg-gray-50 dark:bg-white/[0.03]">
                                                        {r.image ? (
                                                            <Image
                                                                width={48}
                                                                height={48}
                                                                src={r.image}
                                                                alt={r.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-800 dark:text-white/90">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium max-w-[200px] ">{r.name}</span>
                                                        {r.brand && (
                                                            <div className="flex gap-2">
                                                                <Badge variant="light">{r.brand}</Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                    <div>
                                                        {r.category}
                                                        <div className='flex gap-2'>
                                                            <Badge>{r.year}</Badge>
                                                            <Badge>{r.variant}</Badge>
                                                        </div>
                                                    </div>

                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-gray-500 text-start text-bold text-theme-sm dark:text-gray-400">
                                                    {r.p_price?.length > 0 ? <Badge>{r.p_price[0].name} - ₹ {r.p_price[0].value} {r.p_price.length > 1 && `+ ${r.p_price.length - 1}`}</Badge> : `₹ ${r.basePrice}`}

                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                    <Badge size="sm" color={r.statusBadgeColor}>
                                                        {r.status}
                                                    </Badge>
                                                </TableCell>



                                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                    {r.location}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                    <Badge variant='solid' color='success'>{r.inventory}</Badge>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                    <Badge color={r.stockStatus === 'out_of_stock' ? "error" : "success"}>{r.stockStatus === 'out_of_stock' ? 'Out of stock' : 'In stock'}</Badge>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-200"
                                                            onClick={() => alert(`Edit product: ${r.id}`)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300"
                                                            onClick={() => {
                                                                if (confirm(`Are you sure, you want to Delete this product: ${r.name}?`)) {
                                                                    void handleDelete(r.id);
                                                                }
                                                            }}
                                                            disabled={actionLoading}
                                                        >
                                                            {actionLoading ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-200"
                                                            onClick={() => {
                                                                const type = r.stockStatus === 'out_of_stock' ? 'show' : 'hide';
                                                                void handleOutOfStockToggle(r.id, type);
                                                            }}
                                                            disabled={actionLoading}
                                                        >
                                                            {r.stockStatus === 'out_of_stock' ? 'Mark in stock' : 'Mark out of stock'}
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                        ))
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

export default ProductTable;

