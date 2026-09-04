import Image from "next/image";
import { Montserrat } from "next/font/google";
import { FaHeart } from "react-icons/fa";
import type { FormValuesBanner } from "@/app/types";
import { optimizeCloudinaryUrl } from "@/app/utils/optimizeCloudinaryImage";

const montserrat = Montserrat({
    subsets: ["latin", "cyrillic"],
});

type Props = {
    banner: FormValuesBanner;
};

const PreviewBadge = ({ badge }: { badge: string }) => (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary bg-white/55 px-4 py-1.5 text-xs text-gray-700 shadow-[0_0_5px_rgba(130,61,154,0.50)] lg:mb-7 lg:text-base">
        {badge || "Бейдж"}
        <FaHeart className="size-3 text-primary lg:size-4" />
    </span>
);

// const PreviewImage = ({ banner }: Props) => banner.image ? (
//     <Image
//         src={optimizeCloudinaryUrl(banner.image, 1500)}
//         alt={""}
//         fill
//         sizes="(max-width: 1023px) 100vw, 50vw"
//         draggable={false}
//         className="select-none object-cover object-center"
//     />
// ) : null;

const BannerPreview = ({ banner }: Props) => {
    const features = banner.features.filter((feature) => feature.value.trim());

    return (
        <section className={`${montserrat.className} relative overflow-hidden rounded-xl bg-linear-to-t from-black/70 via-black/40 to-black/10 shadow-[0_0_20px_rgba(0,0,0,0.10)] lg:rounded-3xl lg:bg-none lg:bg-white`}>
            <div className="relative -ml-0.5 flex w-[calc(100%+4px)]">
                <div className="hidden min-h-[650px] w-full items-center lg:flex">
                    <div className="relative z-10 w-1/2 px-10 xl:px-16">
                        {
                            banner.badge &&
                            <PreviewBadge badge={banner.badge} />
                        }
                        <h2 className="mb-5 whitespace-pre-line text-5xl font-bold leading-[1.2] text-gray-900">
                            {banner.title || "Заголовок банера"}
                        </h2>
                        {features.length > 0 && (
                            <ul className="list-disc space-y-2 pl-5 text-gray-800 marker:text-lg">
                                {features.map((feature, index) => <li key={`${feature.value}-${index}`}>{feature.value}</li>)}
                            </ul>
                        )}
                        {
                            banner.ctaLabel &&
                            <span className="mt-10 block w-full max-w-[480px] rounded-full bg-primary px-6 py-3 text-center text-white">
                                {banner.ctaLabel}
                            </span>
                        }

                    </div>
                    <div className="absolute right-0 top-0 h-full w-full">
                        <div className="absolute inset-y-0 right-0 flex ">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={optimizeCloudinaryUrl(banner.image, 1500)}
                                alt={""}
                                draggable={false}
                                className="block h-full w-full max-w-full object-cover object-right select-none"
                            />

                            {/* Градиент привязан к фактическому левому краю contain-изображения. */}
                            {/*<div*/}
                            {/*    className="absolute inset-y-0 -left-0.5 w-[calc(30%+2px)] pointer-events-none*/}
                            {/*                       bg-linear-to-r from-white to-transparent*/}
                            {/*                       "*/}
                            {/*    style={{*/}
                            {/*        maskImage: 'linear-gradient(to right, black 0%, black 85%, transparent 100%)',*/}
                            {/*        WebkitMaskImage: 'linear-gradient(to right, black 0%, black 85%, transparent 100%)',*/}
                            {/*    }}*/}
                            {/*/>*/}
                        </div>
                    </div>
                </div>
                <div className="relative flex min-h-[450px] w-full lg:hidden">
                    <Image
                        src={optimizeCloudinaryUrl(banner.mobileImage || banner.image, 1500)}
                        alt={""}
                        fill
                        sizes="(max-width: 1023px) 100vw, 1px"
                        draggable={false}
                        className="object-cover object-center select-none"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/35 to-black/10" />
                    <div className="relative z-10 flex min-h-[450px] w-full flex-1 flex-col gap-4 px-6 pb-12 pt-10 sm:justify-around">
                        <PreviewBadge badge={banner.badge} />
                        <h2 className="whitespace-pre-line text-3xl font-bold leading-tight text-white">
                            {banner.title || "Заголовок банера"}
                        </h2>
                        {features.length > 0 && (
                            <ul className="list-disc space-y-2 pl-5 text-gray-800 marker:text-lg">
                                {features.map((feature, index) => <li key={`${feature.value}-${index}`}>{feature.value}</li>)}
                            </ul>
                        )}
                        {
                            banner.ctaLabel &&
                            <span className="mt-auto sm:mt-0 w-full rounded-full bg-primary px-6 py-3 text-center text-white sm:max-w-[400px]">
                                {banner.ctaLabel}
                            </span>
                        }

                    </div>
                </div>
            </div>
        </section>
    );
};

export default BannerPreview;
