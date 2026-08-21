import LoginForm from "@/components/auth/login-form";
import AuthLayout from "@/components/auth/auth-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Culinary Ledger | Restaurant Management System",
  description: "Sign in to manage your restaurant operations, kitchen, and waitstaff.",
};

export default function Home() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
