"use client";

import React, { useEffect, useMemo, useState } from 'react';

import type { User } from '@/lib/auth';
import serverCallFuction from '@/lib/constantFunction';

type CustomersResponse = {
    status?: boolean;
    success?: boolean;
    message?: string;
    data?: User[];
};

const UsersCompo = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchUsers = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await serverCallFuction<CustomersResponse>('GET',
                    'api/customer/getCustomers'
                );

                // Try common response shapes
                const list = (res as any)?.data ?? (res as any)?.customers ?? (res as any);

                if (!mounted) return;
                setUsers(Array.isArray(list) ? (list as User[]) : []);

                // If backend returns {message} but no array, surface it
                if (!Array.isArray(list) && (res as any)?.message) {
                    setError((res as any)?.message);
                }
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || 'Failed to load users');
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };

        fetchUsers();
        return () => {
            mounted = false;
        };
    }, []);

    const rows = useMemo(() => {
        return users.map((u) => {
            const name = u.full_name || u.username || u.email || '—';
            return {
                id: u.id,
                name,
                email: u.email || '—',
                phone: u.phone || '—',
                role: u.role_name || u.role || '—',
                isActive: u.is_active,
            };
        });
    }, [users]);

    return (
        <div className="p-4">
            <div className="mb-4">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Users</h1>
            </div>

            {loading && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
                    Loading users...
                </div>
            )}

            {!loading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <div className="max-w-full overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="bg-gray-50 dark:bg-white/[0.03]">
                                <tr>
                                    <th className="px-5 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">S.No.</th>
                                    <th className="px-5 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                                    <th className="px-5 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                                    <th className="px-5 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Phone</th>
                                    <th className="px-5 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                                    <th className="px-5 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td className="px-5 py-4" colSpan={6}>
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((r, index) => (
                                        <tr key={String(r.id)} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.03]">
                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{index}</td>
                                            <td className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{r.name}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{r.email}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{r.phone}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{r.role}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {typeof r.isActive === 'boolean' ? (r.isActive ? 'Yes' : 'No') : '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersCompo;

