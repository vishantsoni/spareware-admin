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
};


const safeString = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

const ProductTable: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<ApiProduct[]>([]);

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await serverCallFuction<ProductsApiResponse>(
                    'GET',
                    'api/product/getProducts'
                );

                if (!mounted) return;

                // tolerant failure parse
                const failure = res as unknown as ServerFailure;
                if (res && typeof res === 'object' && 'status' in (res as object) && failure.status === false) {
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
            } catch (e) {
                if (!mounted) return;
                const msg = e instanceof Error ? e.message : 'Failed to load products';
                setError(msg);
                setProducts([]);
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };

        run();
        return () => {
            mounted = false;
        };
    }, []);

    const rows: ProductRow[] = useMemo(() => {
        return products.map((p) => {
            const status = safeString(p.status || (p.visibility ? 'active' : 'inactive'));

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
                (p.base_price ?? (p as { price?: number | string }).price ?? p.unit_value ?? '') as string | number;

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
            const inventory = p.inventory == null ? '' : String(p.inventory);

            return {
                id,
                name,
                category,
                basePrice,
                status,
                statusBadgeColor,
                image,

                brand,
                sku,
                year,
                variant,
                location,
                inventory,
            };

        });
    }, [products]);

    return (
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
                                        Category
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
                                        Brand
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        SKU
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Year
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-100 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Variant
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

                                </TableRow>
                            </TableHeader>


                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell className="px-5 py-4 text-gray-500 text-sm" colSpan={11}>
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
                                            <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90">
                                                {r.name}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {r.category}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {r.basePrice}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                <Badge size="sm" color={r.statusBadgeColor}>
                                                    {r.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {r.brand}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {r.sku}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {r.year}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {r.variant}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {r.location}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {r.inventory}
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
    );
};

export default ProductTable;

