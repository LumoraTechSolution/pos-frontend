"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";

/**
 * Validation schema for email/password login.
 */
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  domain: z.string().min(1, { message: "Workspace domain is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  // In a real multi-tenant app, domain would be extracted from Window location headers.
  // For local testing, we let the user type the subdomain.
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      domain: "DEMO",
    },
  });

  async function resolveTenant(domain: string): Promise<string> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
    const response = await fetch(`${API_BASE_URL}/api/v1/public/tenants/resolve?domain=${domain}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Invalid Workspace ID");
    }
    return result.data.tenantId;
  }

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      // Step 1: Resolve the Domain to the internal Tenant UUID
      const resolvedTenantId = await resolveTenant(values.domain);

      // Step 2: Login passing the resolved Tenant UUID
      const reqPayload = {
        email: values.email,
        password: values.password,
        tenantId: resolvedTenantId, 
      };

      const response = await authService.login(reqPayload);
      setAuth(response.user, response.accessToken, response.refreshToken);
      
      toast.success("Welcome back!");
      
      if (response.user.roles.includes('ADMIN') || response.user.roles.includes('MANAGER')) {
        router.push('/overview');
      } else {
        router.push('/terminal');
      }
    } catch (error: unknown) {
      // Prefer the backend's message (e.g. "Too many login attempts...",
      // "Invalid credentials") over axios's generic "Request failed with status X".
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Slug</FormLabel>
              <FormControl>
                <div className="relative flex items-center">
                  <Input 
                    placeholder="DEMO" 
                    className="rounded-r-none font-mono uppercase focus-visible:z-10 relative" 
                    {...field} 
                    disabled={isLoading}
                  />
                  <div className="bg-muted border border-l-0 px-3 py-2 text-sm text-muted-foreground rounded-r-md">
                    .lumora.com
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="admin@demo.lumora.com" 
                    className="pl-10" 
                    {...field} 
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10" 
                    {...field} 
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>
    </Form>
  );
}
