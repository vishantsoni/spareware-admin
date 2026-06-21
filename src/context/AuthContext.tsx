"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, rolePermissions } from '@/lib/auth';
import type { RolesResponse } from '@/types/role';
import serverCallFuction from '@/lib/constantFunction';

interface AuthContextType {
  user: User | null;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
  updateUserProfile: (profileData: Partial<User>) => void;
  isAuthenticated: boolean;
  role: string | null;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dynamicPermissions, setDynamicPermissions] = useState<Record<string, string[]>>({});

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('spareAuthToken');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        localStorage.removeItem('user');
      }
    } else if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const parsedUser: User = {
          id: payload.id || payload.sub || '',
          phone: payload.phone || '',
          username: payload.username || '',
          role: payload.role || payload.role_name || '',
          role_id: payload.role_id,
          role_name: payload.role_name,
          role_permissions: payload.permissions || payload.role_permissions || [],
          // Keep for backward compatibility
          permissions: payload.permissions || [],
        } as User;
        setUser(parsedUser);
        localStorage.setItem('user', JSON.stringify(parsedUser));
      } catch {
        localStorage.removeItem('spareAuthToken');
      }
    }

    setIsLoading(false);
  }, []);

  const mapDbAccessToPerms = (
    typeName: string | null | undefined,
    flags: { read?: boolean; write?: boolean; create?: boolean }
  ): string[] => {
    const t = (typeName || '').toLowerCase();

    const singularToModule = (name: string) => {
      const aliases: Record<string, string> = {
        // middleware uses first URL segment (typically plural)
        order: 'orders',
        payment: 'payment',
        invoice: 'invoice',
        staff: 'staff',
        staff_member: 'staff',
        customer: 'customers',
        company: 'company',
      };
      return aliases[name] || name;
    };

    const mod = singularToModule(t);
    const perms: string[] = [];

    // Align with your existing static permissions:
    // - read  => module
    // - create => module/add
    // - write => module + module/edit
    if (flags.read) perms.push(mod);
    if (flags.create) perms.push(`${mod}/add`);
    if (flags.write) {
      perms.push(mod);
      perms.push(`${mod}/edit`);
    }

    return perms;
  };

  // Fetch dynamic roles when user is set
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const resp = await serverCallFuction<RolesResponse>('GET', 'api/roles');
        if (!resp.status || !resp.data) return;

        const map: Record<string, string[]> = {};

        (resp.data as any[]).forEach((role) => {
          const roleName = String(role.role_name || '').toLowerCase();
          const accessEntries: any[] = role.access || [];
          const permsSet = new Set<string>();

          accessEntries.forEach((a) => {
            const typeName = a?.type_name;
            const flags = { read: a?.read, write: a?.write, create: a?.create };
            mapDbAccessToPerms(typeName, flags).forEach((p) => permsSet.add(p));
          });

          if (roleName === 'super admin') permsSet.add('*');

          map[roleName] = Array.from(permsSet);
        });

        setDynamicPermissions(map);
      } catch {
        setDynamicPermissions({});
      }
    })();
  }, [user]);

  const login = (data: { token: string; user: User }) => {
    const { token, user } = data;
    document.cookie = `spareAuthToken=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=strict`;
    localStorage.setItem('spareAuthToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('spareAuthToken');
    localStorage.removeItem('user');
    setUser(null);
    setDynamicPermissions({});
  };

  const isAuthenticated = !!user;
  const role = user?.role_id ? user?.role_name : user?.role || null;

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const roleKey = user.role_id ? user?.role_name?.toLowerCase() : user.role.toLowerCase();

    // 1) JWT direct permissions (if present)
    const jwtPerms = user.role_permissions;
    if (jwtPerms && Array.isArray(jwtPerms)) {
      const hasDirectAccess = jwtPerms.some((p) =>
        p === '*' || p === permission || p.startsWith(`${permission}.`)
      );
      if (hasDirectAccess) return true;
    }

    // 2) Dynamic permissions (DB via api/roles) + static fallback
    const perms = dynamicPermissions[roleKey] || rolePermissions[roleKey] || [];

    return (
      perms.includes('*') ||
      perms.includes(permission) ||
      perms.some((p) => p.startsWith(`${permission}.`))
    );
  };

  const updateUserProfile = (profileData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...profileData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUserProfile,
        isAuthenticated,
        role,
        hasPermission,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

