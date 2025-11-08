"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser } from "@/lib/actions/user-actions";
import { useUser } from "@/app/context/UserContext";

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useUser();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await createUser(username.trim());

      if (result.success) {
        login({
          id: result.data.id,
          username: result.data.username,
        });
        router.push("/");
      } else {
        setError(result.error || "Failed to create account");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-sm">
        <Card className="bg-black text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Create account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your username to track you work status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <Button
                variant={"outline"}
                type="submit"
                className="w-full"
                disabled={!username.trim() || isLoading}
              >
                {isLoading ? "Creating You..." : "Go to work status"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
