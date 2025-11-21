"use client";
import Image from "next/image";
import Link from "next/link";

export default function NotFoundPage() {
	return (
		<div className="pt-9 flex flex-col items-center justify-center px-4">
			<Image
				src="/errors/403.png"
				alt="Forbidden"
				width={500}
				height={500}
				className="block"
			/>
			<p className="text-center mt-4">
				Forbidden, you shall not pass!
				{" "}
				<Link href="/" className="underline">Go back to the home page?</Link>
			</p>
		</div>
	);
}
