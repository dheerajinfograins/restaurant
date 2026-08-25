import LoginForm from "@/components/auth/login-form";
import AuthLayout from "@/components/auth/auth-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin Portal | The Culinary Ledger - Multi-Restaurant Platform",
  description: "Super Admin console to register restaurants, manage branch owners, and govern multi-tenant operations.",
};

export default function Home() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
