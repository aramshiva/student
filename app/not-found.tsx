"use client";
import Image from "next/image";
import Link from "next/link";

export default function NotFoundPage() {
	return (
		<div className="pt-9 flex flex-col items-center justify-center px-4">
			<Image
				src="/errors/404.png"
				alt="Page not found"
				width={500}
				height={500}
				className="block"
			/>
			<p className="text-center mt-4">
				Sorry, we couldn{"'"}t find the page you{"'"}re looking for.
				{" "}
				<Link href="/" className="underline">Go back to the home page?</Link>
			</p>
		</div>
	);
}
