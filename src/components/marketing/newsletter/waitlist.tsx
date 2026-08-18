"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { supabase } from "@/lib/supabase";

export const WaitlistPage = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const email = String(formData.get("email") || "").trim();
        const zip_code = String(formData.get("zip_code") || "").trim();
        if (!email) {
            setMessage({ type: "error", text: "Please enter a valid email." });
            setIsSubmitting(false);
            return;
        }

        // If ZIP is provided, validate it must be exactly 5 digits (US ZIP)
        if (zip_code && !/^\d{5}$/.test(zip_code)) {
            setMessage({ type: "error", text: "Please enter a valid 5-digit ZIP code." });
            setIsSubmitting(false);
            return;
        }

        const payload: { email: string; zip_code?: string } = zip_code ? { email, zip_code } : { email };
        const { error } = await supabase.from("waitlist").insert([payload]);
        if (error) {
            // Unique violation code (Postgres)
            // 23505 = unique_violation
            if ((error as any).code === "23505") {
                setMessage({ type: "error", text: "You're already on the waitlist!" });
            } else {
                setMessage({ type: "error", text: "Something went wrong. Please try again." });
            }
        } else {
            setMessage({ type: "success", text: "Thanks for joining! We'll be in touch soon." });
            formRef.current?.reset();
        }

        setIsSubmitting(false);
    };

    return (
        <section className="relative min-h-screen bg-brand-section bg-no-repeat bg-cover bg-[position:15%_center] 2xl:bg-center bg-[url('/snow-globe-city-animation-mobile.svg')] 2xl:bg-[url('/snow-globe-city-animation.svg')]">

            <div className="mx-auto max-w-container px-4 md:px-8 min-h-screen flex items-center justify-center">
                <div className="mx-auto flex w-full max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-col items-center text-center">
                    <h1 className="text-display-sm font-semibold text-primary_on-brand md:text-display-md">Get matched with trusted Christmas light installers</h1>
                    <p className="mt-4 text-lg text-tertiary_on-brand md:mt-5 md:text-xl">
                        Join the waitlist for vetted pros, fast booking, and a brighter holiday season.
                    </p>

                    <Form
                        ref={formRef}
                        onSubmit={handleSubmit}
                        className="mt-8 flex w-full flex-col gap-4 md:flex-row md:justify-center"
                    >
                        <Input
                            className="w-full md:w-auto"
                            isRequired
                            size="md"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            inputClassName="border-none"
                            wrapperClassName="py-0.5 md:w-[460px]"
                        />
                        <Input
                            className="w-full md:w-auto"
                            size="md"
                            name="zip_code"
                            type="text"
                            placeholder="ZIP code"
                            inputClassName="border-none"
                            wrapperClassName="py-0.5 md:w-[120px]"
                            maxLength={5}
                            inputMode="numeric"
                            pattern="[0-9]{5}"
                            autoComplete="postal-code"
                        />
                        <Button
                            type="submit"
                            size="xl"
                            isLoading={isSubmitting}
                            showTextWhileLoading
                            className="data-loading:!bg-brand-solid data-loading:brightness-110"
                        >
                            {isSubmitting ? "Joining..." : "Join Waitlist"}
                        </Button>
                    </Form>

                    {message && (
                        <div
                            className={`mt-3 rounded-lg px-4 py-2 text-sm font-medium ${
                                message.type === "success" ? "bg-success-solid text-white" : "bg-error-solid text-white"
                            }`}
                        >
                            {message.text}
                        </div>
                    )}
                </div>
            </div>


        </section>
    );
};

