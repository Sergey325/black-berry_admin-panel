"use client"

import {CldUploadWidget, type CldUploadWidgetProps} from "next-cloudinary";
import Image from "next/image"
import {useCallback, useEffect, useRef} from "react";
import toast from "react-hot-toast";
import {TbPhotoPlus} from "react-icons/tb";
import {IoMdClose} from "react-icons/io";
import axios from "axios";

type Props = {
    onChange: (value: Array<string>) => void
    value: Array<string>
    folder?: string
    maxFiles?: number
    multiple?: boolean
    uploadLabel?: string
};

type UploadWidgetOptions = NonNullable<CldUploadWidgetProps["options"]> & {
    asset_folder?: string
};

const getUploadedImageUrl = (result: unknown) => {
    const uploadResult = result as { info?: { secure_url?: unknown } };
    return typeof uploadResult.info?.secure_url === "string" ? uploadResult.info.secure_url : null;
};

const ImagesUpload = ({
    onChange,
    value,
    folder = "BlackBerry",
    maxFiles = 10,
    multiple = true,
    uploadLabel = "Додати зображення",
}: Props) => {
    const valueRef = useRef(value);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const handleUpload = useCallback((result: unknown) => {
        if (valueRef.current.length >= maxFiles) {
            toast.error(`Ви не можете завантажити більше ${maxFiles} зображень`)
            return
        }
        const imageUrl = getUploadedImageUrl(result);
        if (!imageUrl) {
            toast.error("Не вдалося отримати посилання на зображення");
            return;
        }
        onChange([...valueRef.current, imageUrl])
    }, [maxFiles, onChange])

    const handleDelete = useCallback(async (imageUrl: string) => {
        await axios.delete("/api/cloudinary", {
            data: {
                imageUrl,
            },
        })
            .then(() => {
                toast.success("Зображення видалено!");
            })
            .catch((error: unknown) => {
                if (axios.isAxiosError<{ error?: string }>(error)) {
                    toast.error(error.response?.data?.error ?? "Не вдалося видалити зображення");
                } else {
                    toast.error("Не вдалося видалити зображення");
                }
            })
            .finally(() => {
                onChange(valueRef.current.filter((i) => i !== imageUrl))
            });
    }, [onChange])

    const widgetOptions: UploadWidgetOptions = {
        maxFiles,
        resourceType: "image",
        maxFileSize: 5500000,
        multiple,
        folder,
        asset_folder: folder,
    };

    return (
        <div>
            <CldUploadWidget
                onSuccess={handleUpload}
                signatureEndpoint="/api/cloudinary/sign"
                options={widgetOptions}
            >
                {({open}) => {
                    return (
                        <>
                            <div
                                onClick={() => open?.()}
                                className="
                                relative
                                cursor-pointer
                                bg-gray-50
                                hover:bg-gray-100
                                transition-colors
                                rounded-xl
                                border-dashed border border-gray-300
                                py-5 md:py-10
                                flex flex-col
                                justify-center items-center
                                gap-4
                                text-black
                            "
                            >
                                <TbPhotoPlus className="size-[25px] md:size-[50px]"/>
                                <div className="text-base font-medium">
                                    {uploadLabel}
                                </div>
                            </div>
                            {value.length > 0 && (
                                <div className="flex flex-wrap gap-2 w-full pt-4">
                                    {
                                        value.map(image => (
                                            <div key={image}
                                                 className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                                                <Image
                                                    alt="Upload"
                                                    height={100} width={100} className="size-20 md:size-25 object-cover"
                                                    src={image}
                                                />
                                                <IoMdClose
                                                    className="absolute top-0 right-0 text-gray-950 hover:text-red-500 hover:bg-red-50 bg-gray-50 transition-colors cursor-pointer"
                                                    size={20}
                                                    onClick={() => handleDelete(image)}
                                                />
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </>
                    )
                }}
            </CldUploadWidget>
        </div>
    )
};

export default ImagesUpload;
