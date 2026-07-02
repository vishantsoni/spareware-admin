"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import serverCallFuction from "@/lib/constantFunction";
import { useAuth } from "@/context/AuthContext";
import type { CatalogApiResponse, Catalog, ServerFailure } from "@/components/catalog/catalogTypes";
import { Pencil, Trash } from "lucide-react";

const CatalogListCompo = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchCatalogs = async () => {
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
            setError(failure.message || "Failed to load catalogs");
            setCatalogs([]);
            return;
        }

        const list = (() => {
            if (Array.isArray(res)) return res as Catalog[];
            const r = res as CatalogApiResponse;
            if (Array.isArray(r?.data)) return r.data as Catalog[];
            if (Array.isArray(r?.catalogs)) return r.catalogs as Catalog[];
            return [];
        })();

        setCatalogs(list);
    };

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            try {
                setLoading(true);
                setError(null);
                await fetchCatalogs();
            } catch (e: unknown) {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : "Failed to load catalogs");
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };
        void run();
        return () => {
            mounted = false;
        };
    }, []);

    const userid = useMemo(() => String(((user as unknown) as { _id?: string })?._id ?? ""), [user]);

    const handleDelete = async (id: string) => {
        if (!id) return;
        if (!userid) {
            setError("User not found. Please login again.");
            return;
        }

        const ok = window.confirm("Delete this catalog? This action cannot be undone.");
        if (!ok) return;

        try {
            setDeletingId(id);
            setError(null);

            const res = await serverCallFuction<unknown>("delete", `api/catalog/deleteCatalog/${id}`, {
                userid,
                catalog_id: id,
            });

            const failure = res as unknown as ServerFailure;
            if (
                res &&
                typeof res === "object" &&
                "status" in (res as object) &&
                failure.status === false
            ) {
                setError(failure.message || "Failed to delete catalog");
                return;
            }

            await fetchCatalogs();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to delete catalog");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                    Catalogs
                </h1>

                <Link
                    href="/catalog/add"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                    + Add Catalog
                </Link>
            </div>

            {loading && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
                    Loading catalogs...
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
                        {catalogs.length === 0 ? (
                            <div className="p-5 text-sm text-gray-600 dark:text-gray-300">
                                No catalogs found.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{catalogs.map((c) => {
                                const id = String(c._id ?? "");
                                return (
                                    <div key={id || c.catalog_name} className="p-5 flex justify-between ">
                                        <div className="mb-2 flex flex-col gap-1">
                                            <div className="text-base font-semibold text-gray-900 dark:text-white/90">
                                                {c.catalog_name || "—"}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Nick: {c.nick_name || "—"}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Discount:{" "}
                                                {c.flattDiscount ? "Flat" : "Value"} — {c.discount ?? "—"}
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-4 w-full ">
                                                <div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Products{" "}:{" "}
                                                    </span>
                                                    <span className="text-sm font-bold text-blue-500 dark:text-blue-400">
                                                        {c.products?.length ?? 0}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Customer{" "}:{" "}
                                                    </span>
                                                    <span className="text-sm font-bold text-blue-500 dark:text-blue-400">
                                                        {c.customers?.length ?? 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <Link
                                                href={`/catalog/edit/${id}`}
                                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-200"
                                            >
                                                <Pencil size={14} />
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(id)}
                                                disabled={deletingId === id}
                                                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed dark:border-red-900/30 dark:bg-white/[0.03]"
                                            >
                                                {deletingId === id ? "Deleting..." : <Trash size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            </div>

                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogListCompo;

