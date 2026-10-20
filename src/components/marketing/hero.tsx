import { getImageProps } from "next/image";
import { ArrowRight } from "lucide-react";
import { enterDemo, startNewSeller } from "@/server/actions/session";
import { cn } from "@/lib/utils";
import { instrumentSerif } from "./fonts";
import { HeroStage } from "./hero-stage";
import { SubmitButton, TextSubmit } from "./submit-button";

// Every line here is accounted for in docs/COPY.md.

export function DemoButton({ className }: { className?: string }) {
  return (
    <form action={enterDemo} className={className}>
      <SubmitButton
        pendingLabel="Opening Ada's workspace…"
        className="h-14 w-full gap-2.5 rounded-[10px] px-7 text-[1.05rem] font-semibold shadow-[0_1px_2px_rgb(11_18_21/0.12),0_8px_20px_-8px_rgb(15_123_95/0.55)] hover:bg-cleared-strong sm:w-auto"
      >
        Try the live demo
        <ArrowRight className="size-[1.1rem]" aria-hidden />
      </SubmitButton>
    </form>
  );
}

export function NewSellerLink({ className }: { className?: string }) {
  return (
    <form action={startNewSeller} className={className}>
      <TextSubmit pendingLabel="Creating your workspace…">or start as a new seller</TextSubmit>
    </form>
  );
}

function heroPhoto() {
  const common = { alt: "", quality: 85 };
  const { props: wide } = getImageProps({ ...common, src: "/landing/desk-wide.png", width: 1586, height: 992, sizes: "(min-width: 1280px) min(100vw, 1728px), 172vw" });
  const { props: tall } = getImageProps({ ...common, src: "/landing/desk-tall.png", width: 941, height: 1672, sizes: "160vw" });
  return { wide, tall };
}

export function Hero() {
  const { wide, tall } = heroPhoto();
  // `rest` keeps the wide image as the fallback <img>; the phone layout swaps in the portrait photo.
  const { srcSet: wideSrcSet, sizes: _wideSizes, ...rest } = wide;
  void _wideSizes;

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-[#F2EBDE] xl:h-[min(62.5vw,1080px)] xl:min-h-[720px]">
      {/* The words. On desktop they sit on the empty left of the photo. */}
      <div className="pointer-events-none relative z-10 xl:absolute xl:inset-0">
        <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col px-5 pt-28 sm:px-8 sm:pt-36 xl:justify-center xl:px-[clamp(2rem,5.5vw,6rem)] xl:pt-6">
          <div className="pointer-events-auto max-w-[40rem]">
            <h1
              id="hero-title"
              className="text-[clamp(3.4rem,15vw,4.6rem)] leading-[0.94] font-bold tracking-[-0.05em] text-ink sm:text-[5.4rem] xl:text-[clamp(5.6rem,6.6vw,7.25rem)]"
            >
              Get paid,
              <br />
              and{" "}
              <span className={cn(instrumentSerif.className, "inline-block pr-[0.06em] text-[1.13em] leading-[0.8] font-normal tracking-[-0.02em]")}>stay</span>{" "}
              paid.
            </h1>
            <p className="mt-6 max-w-[27rem] text-[1.12rem] leading-[1.55] text-pretty text-ink/75 sm:mt-7 sm:text-[1.25rem]">
              Check every sale before PayPal does, keep your proof, and answer disputes with evidence.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
              <DemoButton />
              <NewSellerLink className="text-center sm:text-left" />
            </div>
            <p className="mt-6 text-[0.8rem] text-ink/60">PayPal sandbox · no sign-up · not affiliated with PayPal</p>
          </div>
        </div>
      </div>

      {/* The desk photo. Phone: the portrait shot covers the whole hero. Tablet: the right part of
          the wide shot sits below the words. Desktop: the wide shot is the hero, right-aligned. */}
      <div
        className={cn(
          "@container absolute inset-x-0 top-[11rem] bottom-0 -z-10",
          "sm:relative sm:inset-auto sm:top-auto sm:bottom-auto sm:z-0 sm:-mt-16 sm:ml-[-68%] sm:aspect-[1586/992] sm:w-[168%]",
          "xl:absolute xl:inset-y-0 xl:top-0 xl:bottom-0 xl:right-0 xl:left-auto xl:mt-0 xl:ml-0 xl:h-full xl:w-auto",
          "sm:[mask-image:linear-gradient(to_bottom,transparent,#000_16%)] xl:[mask-image:none] min-[1729px]:[mask-image:linear-gradient(to_right,transparent,#000_9%)]",
        )}
      >
        <picture>
          <source media="(max-width: 639px)" srcSet={tall.srcSet} sizes={tall.sizes} />
          <source media="(min-width: 640px)" srcSet={wideSrcSet} sizes={wide.sizes} />
          <img
            {...rest}
            alt=""
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="absolute inset-0 size-full object-cover object-bottom sm:object-center"
          />
        </picture>
        <div className="hidden sm:block">
          <HeroStage layout="scene" />
        </div>
      </div>

      {/* Phone: the card sits under the words, over the paper in the portrait photo. */}
      <div className="relative z-10 px-5 pt-12 pb-36 sm:hidden">
        <HeroStage layout="stack" />
      </div>
    </section>
  );
}
