"use client";

import { useState } from "react";
import { LoginCredentials } from "@/types/gradebook";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
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
import { EyeOff, TriangleAlert } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "./ui/drawer";
import Link from "next/link";

interface LoginProps {
  onLogin: (credentials: LoginCredentials) => void;
  isLoading: boolean;
  error: string | null;
}

export default function Login({ onLogin, isLoading, error }: LoginProps) {
  const defaultDistrict = {
    name: "Northshore School District No. 417",
    url: "https://wa-nor-psv.edupoint.com",
    address: "Bothell WA 98021",
    zipcode: "98021",
  };
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: "",
    district_url: defaultDistrict.url.replace(/\/$/, ""),
    reporting_period: "S2FM",
  });
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);
  const [zip, setZip] = useState("");
  const [districts, setDistricts] = useState<
    { name: string; url: string; address: string; zipcode: string | null }[]
  >([]);
  const [districtSearchLoading, setDistrictSearchLoading] = useState(false);
  const [districtSearchError, setDistrictSearchError] = useState<string | null>(
    null
  );
  const [showCustomUrl, setShowCustomUrl] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(credentials);
  };

  const handleConfirmLogin = () => {
    onLogin(credentials);
  };

  const searchDistricts = async () => {
    setDistrictSearchError(null);
    setHasSearched(true);
    const five = zip.trim();
    if (!/^\d{5}$/.test(five)) {
      setDistrictSearchError("Enter a valid 5 digit ZIP code");
      return;
    }
    setDistrictSearchLoading(true);
    try {
      const res = await fetch(`/api/synergy/districts/${five}`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      setDistricts(data.districts || []);
    } catch (e) {
      setDistrictSearchError(
        (e as Error).message || "District lookup failed. Try again."
      );
    } finally {
      setDistrictSearchLoading(false);
    }
  };

  const shouldShowAlert =
    credentials.district_url === "https://wa-nor-psv.edupoint.com";

  const LoginButton = () => {
    if (shouldShowAlert) {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" disabled={isLoading} className="w-full">
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <TriangleAlert /> Warning
              </AlertDialogTitle>
              <AlertDialogDescription>
                This app is not affiliated with Northshore School District or
                Edupoint Educational Systems. Your credentials are never saved
                or shared—only used to connect to StudentVUE® servers. Use is at
                your own risk and subject to{" "}
                <Link
                  href="https://www.edupoint.com/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Edupoint{"'"}s terms of service
                </Link>
                .
                <br />
                <br />
                Student is currently pending approval from Northshore for
                approval for app use. Until, that is complete Student is not
                recommended for public use unless you understand and accept the
                risks.{" "}
                <strong>
                  Never share your login information with anyone you do not
                  trust. If you suspect the privacy has been violated, please
                  contact your student{"'"}s school immediately.
                </strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmLogin}>
                I understand.
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <Button
        type="submit"
        disabled={isLoading || !credentials.district_url}
        className="w-full"
        onClick={handleSubmit}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen dark:bg-zinc-900">
        <div className="text-left w-full max-w-md mb-4">
          <Link href="/">
            <p className="font-bold font-[Gosha]">student</p>
          </Link>
          <p className="text-zinc-500">
            A alternative client for StudentVUE®, with a refreshed UI and more
            powerful features to help maintain academics.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col space-y-4 w-full max-w-md"
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
            <div className="flex items-center mt-2 pt-2">
              <EyeOff className="w-9 h-3 mr-1 text-zinc-500" />
              <p className="text-xs text-zinc-500">
                Your device directly, and securely connects to
                Synergy/StudentVUE®. We can{"'"}t see your passwords or your
                grades.{" "}
                <Link href="/privacy" className="underline">
                  Read our privacy policy.
                </Link>
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Drawer
              open={openDrawer}
              onOpenChange={(o) => {
                if (!o) {
                  setZip("");
                  setDistricts([]);
                  setHasSearched(false);
                  setDistrictSearchError(null);
                  setShowCustomUrl(false);
                }
                setOpenDrawer(o);
              }}
            >
              <DrawerTrigger asChild>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 border rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition flex flex-col"
                >
                  <span className="font-medium text-sm truncate">
                    {selectedDistrict.name}
                  </span>
                  <span className="text-xs text-zinc-500 truncate">
                    {selectedDistrict.address}
                  </span>
                </button>
              </DrawerTrigger>
              <DrawerContent className="flex flex-col dark:bg-zinc-800">
                <DrawerHeader>
                  <DrawerTitle>Select District</DrawerTitle>
                  <DrawerDescription>
                    Search by ZIP code or enter a custom Synergy Server URL.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 space-y-4 overflow-y-auto">
                  {!showCustomUrl && (
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <div className="flex space-x-2 w-96">
                          <Input
                            placeholder="ZIP Code"
                            inputMode="numeric"
                            maxLength={5}
                            value={zip}
                            onChange={(e) =>
                              setZip(e.target.value.replace(/[^0-9]/g, ""))
                            }
                          />
                          <Button
                            type="button"
                            onClick={searchDistricts}
                            disabled={districtSearchLoading || zip.length !== 5}
                          >
                            {districtSearchLoading ? "Searching..." : "Search"}
                          </Button>
                        </div>
                      </div>
                      {districtSearchError && (
                        <p className="text-xs text-red-600">
                          {districtSearchError}
                        </p>
                      )}
                      {hasSearched &&
                        !districtSearchLoading &&
                        districts.length === 0 &&
                        !districtSearchError && (
                          <p className="text-xs text-zinc-500">
                            No districts found. Try another ZIP or use a custom
                            URL.
                          </p>
                        )}
                      {districts.length > 0 && (
                        <div className="max-h-72 overflow-y-auto border rounded p-2 space-y-2 text-sm">
                          {districts.map((d) => {
                            const selected =
                              selectedDistrict.url.replace(/\/$/, "") ===
                              d.url.replace(/\/$/, "");
                            return (
                              <Button
                                key={d.url}
                                variant="secondary"
                                onClick={() => {
                                  setSelectedDistrict({
                                    name: d.name,
                                    url: d.url.replace(/\/$/, ""),
                                    address: d.address,
                                    zipcode: d.zipcode || "",
                                  });
                                  setCredentials((c) => ({
                                    ...c,
                                    district_url: d.url.replace(/\/$/, ""),
                                  }));
                                  setOpenDrawer(false);
                                }}
                                className={`py-2 h-full w-full text-center hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                                  selected
                                    ? "border-blue-500 bg-blue-150"
                                    : "not-dark:border-zinc-200"
                                }`}
                              >
                                <div>
                                  <p className="font-medium">{d.name}</p>
                                  <p className="text-xs text-zinc-500">
                                    {d.address}
                                  </p>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1">
                        <p className="text-xs text-zinc-500">
                          {districts.length > 0 &&
                            `${districts.length} result${
                              districts.length === 1 ? "" : "s"
                            }`}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCustomUrl(true)}
                          className="text-xs underline text-zinc-500 hover:text-black dark:hover:text-zinc-600"
                        >
                          Use custom URL
                        </button>
                      </div>
                    </div>
                  )}
                  {showCustomUrl && (
                    <div className="space-y-2">
                      <label
                        htmlFor="district_url"
                        className="block text-xs font-medium"
                      >
                        District Synergy Server URL:
                      </label>
                      <Input
                        type="url"
                        id="district_url"
                        value={credentials.district_url}
                        placeholder="https://example.edupoint.com"
                        onChange={(e) =>
                          setCredentials({
                            ...credentials,
                            district_url: e.target.value,
                          })
                        }
                      />
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          onClick={() => {
                            if (credentials.district_url) {
                              setSelectedDistrict({
                                name: credentials.district_url,
                                url: credentials.district_url,
                                address: credentials.district_url,
                                zipcode: "",
                              });
                              setOpenDrawer(false);
                            }
                          }}
                          disabled={!credentials.district_url}
                        >
                          Use This URL
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="border"
                          onClick={() => setShowCustomUrl(false)}
                        >
                          Back to Search
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button type="button" variant="outline">
                      Close
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <LoginButton />
        </form>
        <p className="text-zinc-500 text-xs pt-5 w-full max-w-md mb-4">
          StudentVUE® is a registered trademark of Edupoint Educational Systems,
          LLC. This project is not affiliated with Edupoint, or Synergy.
        </p>
      </div>
    </>
  );
}
