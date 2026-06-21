"use client";

import React, { useMemo, useState } from 'react';

import serverCallFuction from '@/lib/constantFunction';
import { useAuth } from '@/context/AuthContext';

import type { CategoryCreateSubItem } from './types';

type CreateCategoryBody = {
    userid: string;
    cat_name: string;
    sub_items?: CategoryCreateSubItem[];
};

const AddCategoryCompo = () => {
    const { user } = useAuth();

    console.log("users - ", user);


    const [catName, setCatName] = useState('');
    const [subItems, setSubItems] = useState<CategoryCreateSubItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);


    const userid = useMemo(() => {
        // backend expects `userid: string`
        // AuthContext maps JWT payload to `user.id`.
        return String(user?._id ?? '');
    }, [user?.id]);

    const catNameTrimmed = catName.trim();
    const catNameError = useMemo(() => {
        if (!catNameTrimmed) return 'Category name is required.';
        if (typeof catNameTrimmed !== 'string' || catNameTrimmed.length < 3) return 'Category name must be at least 3 characters.';
        return null;
    }, [catNameTrimmed]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError(null);
        setSuccess(null);

        if (!userid) {
            setError('User not found. Please login again.');
            return;
        }

        if (catNameError) {
            setError(catNameError);
            return;
        }

        // Basic validation for sub-items UI
        const normalizedSubItems: CategoryCreateSubItem[] = subItems
            .map((si) => {
                const model_name = String(si.model_name ?? '').trim();
                const years = (si.years ?? [])
                    .map((y) => {
                        const year_val = Number(y.year_val);
                        const variants = (y.variants ?? [])
                            .map((v) => ({
                                variant_name: String(v.variant_name ?? '').trim(),
                                created: v.created,
                            }))
                            .filter((v) => v.variant_name.length > 0);

                        return { year_val, variants };
                    })
                    .filter((y) => Number.isFinite(y.year_val) && y.variants.length > 0);

                return { model_name, years };
            })
            .filter((si) => si.model_name.length > 0 && si.years.length > 0);

        const body: CreateCategoryBody = {
            userid,
            cat_name: catNameTrimmed,
            sub_items: normalizedSubItems,
        };

        if (!Array.isArray(body.sub_items)) {
            setError('sub_items must be an array.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await serverCallFuction('POST', 'api/category/createCategory', body);

            if (res?.status === 'Success' || res?.success === 'Success') {
                setSuccess(res?.message || 'Category created successfully.');
                setCatName('');
                setSubItems([]);
            } else {
                setError(res?.message || 'Failed to create category.');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to create category.';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4">
            <div className="mb-4">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Add Category</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Create a new category (cat_name & optional sub_items).</p>
            </div>

            <form
                onSubmit={handleSubmit}
                className=" rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]"
            >
                <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Category Name</label>
                    <input
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                        placeholder="e.g., APRILIA"
                    />
                    {catNameError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{catNameError}</p>}
                </div>

                <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Sub Items (optional)
                    </label>

                    <div className="mb-3">
                        <button
                            type="button"
                            onClick={() =>
                                setSubItems((prev) => [
                                    ...prev,
                                    { model_name: '', years: [] },
                                ])
                            }
                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-200"
                        >
                            + Add Sub Item
                        </button>
                    </div>

                    {subItems.length === 0 ? (
                        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/[0.05] dark:bg-white/[0.03]">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-700 ring-1 ring-gray-200 dark:bg-black/20 dark:text-gray-200 dark:ring-white/[0.08]">
                                +
                            </span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Add at least one sub item if you want nested model/year/variant selection.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {subItems.map((sub, subIndex) => (
                                <div
                                    key={subIndex}
                                    className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/[0.05] dark:bg-white/[0.03]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Model Name
                                            </label>
                                            <input
                                                value={sub.model_name}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setSubItems((prev) =>
                                                        prev.map((si, i) =>
                                                            i === subIndex ? { ...si, model_name: v } : si
                                                        )
                                                    );
                                                }}
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                                                placeholder="e.g., RSV4 or ALL MODELS"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setSubItems((prev) => prev.filter((_, i) => i !== subIndex))}
                                            className="mt-6 inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/30 dark:bg-white/[0.03]"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="mt-4">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Years</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSubItems((prev) =>
                                                        prev.map((si, i) =>
                                                            i === subIndex
                                                                ? {
                                                                    ...si,
                                                                    years: [...si.years, { year_val: 0, variants: [] }],
                                                                }
                                                                : si
                                                        )
                                                    );
                                                }}
                                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-200"
                                            >
                                                + Add Year
                                            </button>
                                        </div>

                                        {sub.years.length === 0 ? (
                                            <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-500 dark:border-white/[0.05] dark:bg-black/20 dark:text-gray-400">
                                                Add years for this model.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {sub.years.map((year, yearIndex) => (
                                                    <div
                                                        key={yearIndex}
                                                        className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/[0.05] dark:bg-black/20"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                                                    Year
                                                                </label>
                                                                <input
                                                                    value={String(year.year_val)}
                                                                    onChange={(e) => {
                                                                        const v = e.target.value;
                                                                        const num = Number(v);
                                                                        setSubItems((prev) =>
                                                                            prev.map((si, i) =>
                                                                                i === subIndex
                                                                                    ? {
                                                                                        ...si,
                                                                                        years: si.years.map((yy, j) =>
                                                                                            j === yearIndex ? { ...yy, year_val: num } : yy
                                                                                        ),
                                                                                    }
                                                                                    : si
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                                                                    placeholder="e.g., 1999"
                                                                />
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSubItems((prev) =>
                                                                        prev.map((si, i) =>
                                                                            i === subIndex
                                                                                ? { ...si, years: si.years.filter((_, j) => j !== yearIndex) }
                                                                                : si
                                                                        )
                                                                    );
                                                                }}
                                                                className="mt-6 inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/30 dark:bg-white/[0.03]"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>

                                                        <div className="mt-4">
                                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Variants</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSubItems((prev) =>
                                                                            prev.map((si, i) =>
                                                                                i === subIndex
                                                                                    ? {
                                                                                        ...si,
                                                                                        years: si.years.map((yy, j) =>
                                                                                            j === yearIndex
                                                                                                ? { ...yy, variants: [...yy.variants, { variant_name: '' }] }
                                                                                                : yy
                                                                                        ),
                                                                                    }
                                                                                    : si
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-200"
                                                                >
                                                                    + Add Variant
                                                                </button>
                                                            </div>

                                                            {year.variants.length === 0 ? (
                                                                <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-500 dark:border-white/[0.05] dark:bg-black/20 dark:text-gray-400">
                                                                    Add variants for year {year.year_val || ''}.
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {year.variants.map((variant, variantIndex) => (
                                                                        <div
                                                                            key={variantIndex}
                                                                            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-white/[0.05] dark:bg-white/[0.03]"
                                                                        >
                                                                            <input
                                                                                value={variant.variant_name}
                                                                                onChange={(e) => {
                                                                                    const v = e.target.value;
                                                                                    setSubItems((prev) =>
                                                                                        prev.map((si, i) =>
                                                                                            i === subIndex
                                                                                                ? {
                                                                                                    ...si,
                                                                                                    years: si.years.map((yy, j) =>
                                                                                                        j === yearIndex
                                                                                                            ? {
                                                                                                                ...yy,
                                                                                                                variants: yy.variants.map((vv, k) =>
                                                                                                                    k === variantIndex
                                                                                                                        ? { ...vv, variant_name: v }
                                                                                                                        : vv
                                                                                                                ),
                                                                                                            }
                                                                                                            : yy
                                                                                                    ),
                                                                                                }
                                                                                                : si
                                                                                        )
                                                                                    );
                                                                                }}
                                                                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                                                                                placeholder="e.g., Factory, RR"
                                                                            />

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setSubItems((prev) =>
                                                                                        prev.map((si, i) =>
                                                                                            i === subIndex
                                                                                                ? {
                                                                                                    ...si,
                                                                                                    years: si.years.map((yy, j) =>
                                                                                                        j === yearIndex
                                                                                                            ? {
                                                                                                                ...yy,
                                                                                                                variants: yy.variants.filter((_, k) => k !== variantIndex),
                                                                                                            }
                                                                                                            : yy
                                                                                                    ),
                                                                                                }
                                                                                                : si
                                                                                        )
                                                                                    );
                                                                                }}
                                                                                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/30 dark:bg-white/[0.03]"
                                                                            >
                                                                                X
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>



                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? 'Creating...' : 'Create Category'}
                    </button>
                </div>


                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-200">
                        {success}
                    </div>
                )}
            </form>
        </div>
    );
};

export default AddCategoryCompo;

