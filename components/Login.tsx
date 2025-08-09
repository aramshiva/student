"use client";

import { useState } from "react";
import { LoginCredentials } from "@/types/gradebook";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "./ui/accordion";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./ui/alert-dialog";

interface LoginProps {
    onLogin: (credentials: LoginCredentials) => void;
    isLoading: boolean;
    error: string | null;
}

export default function Login({ onLogin, isLoading, error }: LoginProps) {
    const [credentials, setCredentials] = useState<LoginCredentials>({
        username: "",
        password: "",
        district_url: "https://wa-nor-psv.edupoint.com",
        reporting_period: "S2FM"
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(credentials);
    };

    const handleConfirmLogin = () => {
        onLogin(credentials);
    };

    const shouldShowAlert = credentials.district_url === "https://wa-nor-psv.edupoint.com";

    const LoginButton = () => {
        if (shouldShowAlert) {
            return (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            type="button"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Warning</AlertDialogTitle>
                            <AlertDialogDescription>
                                The Northshore School District is not affiliated with this app. Use of the app is at your own risk.
                                Your credentials are never saved, stored, or shared. They are just used to contact StudentVUE.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmLogin}>I understand.</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            );
        }

        return (
            <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                onClick={handleSubmit}
            >
                {isLoading ? "Signing In..." : "Sign In"}
            </Button>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center bg-white min-h-screen text-black">
            <p className="font-bold">Student</p>
            <p>StudentVUE alternative Client</p>
            <div className="flex flex-col items-center justify-center p-8 w-full max-w-md space-y-6">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col space-y-4 w-full"
                >
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium mb-2"
                        >
                            Student ID:
                        </label>
                        <Input
                            type="text"
                            id="username"
                            value={credentials.username}
                            onChange={(e) =>
                                setCredentials({ ...credentials, username: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium mb-2"
                        >
                            Password:
                        </label>
                        <Input
                            type="password"
                            id="password"
                            value={credentials.password}
                            onChange={(e) =>
                                setCredentials({ ...credentials, password: e.target.value })
                            }
                        />
                    </div>
                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Advanced Settings</AccordionTrigger>
                            <AccordionContent>
                                <label
                                    htmlFor="district_url"
                                    className="block text-sm font-medium mb-2"
                                >
                                    District URL:
                                </label>
                                <Input
                                    type="url"
                                    id="district_url"
                                    value={credentials.district_url}
                                    onChange={(e) =>
                                        setCredentials({
                                            ...credentials,
                                            district_url: e.target.value,
                                        })
                                    }
                                />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}
                    <LoginButton />
                </form>
            </div>
        </div>
    );
}
