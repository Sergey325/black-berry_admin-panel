"use client"

import {CldUploadWidget} from "next-cloudinary";
import Image from "next/image"
import {useCallback, useEffect, useRef} from "react";
import toast from "react-hot-toast";
import {TbPhotoPlus} from "react-icons/tb";
import {IoMdClose} from "react-icons/io";
import axios from "axios";

declare global {
    var cloudinary: any
}

const uploadPreset = "blackberry"

type Props = {
    onChange: (value: Array<string>) => void
    value: Array<string>
};

const ImagesUpload = ({onChange, value}: Props) => {
    const valueRef = useRef(value);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const handleUpload = useCallback((result: any) => {
        if (valueRef.current.length > 9) {
            toast.error("You can't upload more than 10 images")
            return
        }
        onChange([...valueRef.current, result.info.secure_url])
    }, [onChange])

    const handleDelete = useCallback(async (imageUrl: string) => {
        await axios.delete("/api/image", {
            data: {
                publicId: imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)?.[1],
            },
        })
            .then(() => {
                toast.success("Зображення видалено!");
            })
            .catch((error) => {
                toast.error(error?.response?.data?.error);
            })
            .finally(() => {
                onChange(valueRef.current.filter((i) => i !== imageUrl))
            });
    }, [onChange])

    return (
        <div>
            <CldUploadWidget
                onSuccess={handleUpload}
                uploadPreset={uploadPreset}
                options={{
                    maxFiles: 10,
                    resourceType: "image",
                    maxFileSize: 5500000,
                    multiple: true,
                    folder: "BlackBerry"
                }}
            >
                {({open}) => {
                    return (
                        <>
                            <div
                                onClick={() => open?.()}
                                className="
                                relative
                                cursor-pointer
                                hover:opacity-70
                                transition
                                border-dashed border-2 border-gray-600
                                py-5 md:py-10
                                flex flex-col
                                justify-center items-center
                                gap-4
                                text-black
                            "
                            >
                                <TbPhotoPlus className="size-[25px] md:size-[50px]"/>
                                <div className="font-semibold text-sm md:text-lg">
                                    Click to upload images
                                </div>
                            </div>
                            {value.length > 0 && (
                                <div className="flex flex-wrap gap-2 w-full h-full pt-4">
                                    {
                                        value.map(image => (
                                            <div key={image}
                                                 className="relative rounded-lg overflow-hidden border-gray-800 border-2">
                                                <Image
                                                    alt="Upload"
                                                    height={100} width={100} className="size-20 md:size-25"
                                                    src={image}
                                                />
                                                <IoMdClose
                                                    className="absolute top-0 right-0 text-gray-950 hover:text-gray-600 bg-gray-50 transition cursor-pointer"
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