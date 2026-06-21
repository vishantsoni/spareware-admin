"use client";

import React, { useEffect, useState } from 'react';


import serverCallFuction from '@/lib/constantFunction';

type Variant = {
    _id?: string;
    variant_name?: string;
    created?: string;
};

type Year = {
    _id?: string;
    year_val?: number;
    variants?: Variant[];
};

type SubItem = {
    _id?: string;
    model_name?: string;
    years?: Year[];
};

type Category = {
    _id?: string;
    userid?: string;
    cat_name?: string;
    sub_items?: SubItem[];
    createdAt?: string;
};

type CategoriesResponse = {
    status?: boolean;
    success?: boolean;
    message?: string;
    data?: Category[];
    categories?: Category[];
};

const CategoryCompo = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        let mounted = true;

        const fetchCategories = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await serverCallFuction<CategoriesResponse>('GET', 'api/category/getCategory');

                // handle multiple possible response shapes
                const r = res as unknown as Partial<CategoriesResponse> & Record<string, unknown>;
                const list = r?.data ?? r?.categories ?? (r as unknown);



                if (!mounted) return;

                if (Array.isArray(list)) {
                    setCategories(list as Category[]);
                    return;
                }

                setCategories([]);
                const resAny = res as unknown as Record<string, unknown>;
                const msg = typeof resAny?.message === 'string' ? (resAny['message'] as string) : undefined;
                if (typeof msg === 'string') {
                    setError(msg);
                }

            } catch (e: unknown) {
                if (!mounted) return;
                const msg = e instanceof Error ? e.message : 'Failed to load categories';
                setError(msg);
            } finally {

                if (!mounted) return;
                setLoading(false);
            }
        };

        fetchCategories();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Categories ( Segments )</h1>
                <a
                    href="/category/add"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                    + Add Category
                </a>
            </div>

            {loading && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
                    Loading categories...
                </div>
            )}

            {!loading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {categories.length === 0 ? (
                            <div className="p-5 text-sm text-gray-600 dark:text-gray-300">No categories found.</div>
                        ) : (
                            categories.map((cat) => (
                                <div key={String(cat._id ?? cat.cat_name ?? 'cat')} className="p-5">

                                    <div className="mb-3 flex flex-col gap-1">
                                        <div className="text-base font-semibold text-gray-900 dark:text-white/90">
                                            {cat.cat_name || '—'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {cat._id || '—'}</div>
                                    </div>

                                    {cat.sub_items && cat.sub_items.length > 0 ? (
                                        <div className="space-y-4">
                                            {cat.sub_items.map((sub, subIndex) => (
                                                <div
                                                    key={String(sub._id ?? sub.model_name ?? `sub-${subIndex}`)}
                                                    className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/[0.05] dark:bg-white/[0.02]"
                                                >

                                                    <div className="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">
                                                        Model: {sub.model_name || '—'}
                                                    </div>

                                                    {sub.years && sub.years.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {sub.years.map((y, yearIndex) => (
                                                                <div
                                                                    key={String(y._id ?? y.year_val ?? `year-${yearIndex}`)}
                                                                    className="rounded-lg bg-white p-2 dark:bg-black/10"
                                                                >

                                                                    <div className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                                                                        Year: {y.year_val ?? '—'}
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {y.variants && y.variants.length > 0 ? (
                                                                            y.variants.map((v, variantIndex) => (
                                                                                <span

                                                                                    key={String(v._id ?? v.variant_name ?? `variant-${variantIndex}`)}

                                                                                    className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/20"
                                                                                >
                                                                                    {v.variant_name || '—'}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-xs text-gray-500 dark:text-gray-400">No variants</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">No years</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">No sub items.</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default CategoryCompo;

