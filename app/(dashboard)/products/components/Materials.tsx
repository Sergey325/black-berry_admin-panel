"use client";

import {useMemo, useState} from "react";
import { MdEdit, MdAdd } from "react-icons/md";
import Dropdown from "@/app/components/DropDown";
import {IMaterial} from "@/app/actions/getMaterials";
import ToolTip from "@/app/components/ToolTip";
import axios from "axios";
import {FiCheck, FiTrash2, FiX} from "react-icons/fi";
import type {CacheInvalidationResponse} from "@/app/types";
import {CACHE_INVALIDATION_WARNING} from "@/app/utils/cacheInvalidationWarning";


interface Props {
    materialsList: IMaterial[],
    initialValue?: IMaterial | null,
    onSelectedValueChange: (selectedValue: IMaterial) => void,
}

type MaterialMutationResponse = IMaterial & CacheInvalidationResponse;

const inputClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200";

const Material = ({
    materialsList,
    initialValue,
    onSelectedValueChange,
}: Props) => {
    const [materialsEdit, setMaterialsEdit] = useState(false);
    const [materials, setMaterials] = useState(materialsList);

    const materialOptions = useMemo(() => {
        if (!materials) return []
        return materials.map((material) => ({
            value: material,
            label: material.name,
            onClick: function () {
                onSelectedValueChange(this.value)
            },
        }))
    }, [materials, onSelectedValueChange]);

    const [newName, setNewName] = useState("");

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");

    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setError(null);
        try {
            const { data } = await axios.post<MaterialMutationResponse>("/api/material", {
                name: newName.trim(),
            });
            setMaterials([...materials, data])
            setNewName("");
            if (!data.cacheInvalidated) setError(CACHE_INVALIDATION_WARNING);
        } catch (error: unknown) {
            setError(axios.isAxiosError<{error?: string}>(error) ? error.response?.data?.error ?? "Помилка створення" : "Помилка створення");
        }
    };

    const startEdit = (m: IMaterial) => {
        setEditingId(m.id);
        setEditingName(m.name);
        setError(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingName("");
    };

    const handleUpdate = async (id: number) => {
        if (!editingName.trim()) return;
        setError(null);
        try {
            const { data } = await axios.put<MaterialMutationResponse>(`/api/material/${id}`, {
                name: editingName.trim(),
            });
            setMaterials(prev =>
                prev.map(material =>
                    material.id === id ? data : material
                )
            );
            cancelEdit();
            if (!data.cacheInvalidated) setError(CACHE_INVALIDATION_WARNING);
        } catch (error: unknown) {
            setError(axios.isAxiosError<{error?: string}>(error) ? error.response?.data?.error ?? "Помилка редагування" : "Помилка редагування");
        }
    };

    const handleDelete = async (id: number) => {
        setError(null);
        try {
            const { data } = await axios.delete<MaterialMutationResponse>(`/api/material/${id}`);
            setMaterials(materials.filter(m => m.id !== data.id))
            if (!data.cacheInvalidated) setError(CACHE_INVALIDATION_WARNING);
        } catch (error: unknown) {
            setError(axios.isAxiosError<{error?: string}>(error) ? error.response?.data?.error ?? "Помилка видалення" : "Помилка видалення");
        }
    };

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="min-w-0 flex gap-2 items-center">
                <Dropdown
                    placeholder={initialValue?.name}
                    options={materialOptions}
                    className="min-w-0"
                    buttonClassName={"rounded-lg! px-2! sm:px-4!"}
                />
                <ToolTip label="Редагувати">
                    <button type="button" onClick={() => setMaterialsEdit(!materialsEdit)} className="inline-flex size-11 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-50 hover:text-blue-600" aria-label="Редагувати товар">
                        <MdEdit className="size-7"/>
                    </button>
                </ToolTip>
            </div>

            {materialsEdit && (
                <div className="flex w-full flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {error && (
                        <p className="text-red-600 text-sm">{error}</p>
                    )}

                    {materials.map((m) => (
                        <div key={m.id} className="flex items-center gap-2">
                            {editingId === m.id ? (
                                <>
                                    <input
                                        autoFocus
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleUpdate(m.id);
                                            if (e.key === "Escape") cancelEdit();
                                        }}
                                        className={`${inputClass} flex-1 text-base`}
                                    />
                                    <div className="flex justify-end gap-2 md:justify-center">
                                        <ToolTip label="Зберегти">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdate(m.id)}
                                                aria-label="Зберегти"
                                                className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-800">
                                                <FiCheck className={"size-5"} />
                                            </button>
                                        </ToolTip>
                                        <ToolTip label="Скасувати">
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                aria-label="Скасувати"
                                                className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                                            >
                                                <FiX className={"size-5"} />
                                            </button>
                                        </ToolTip>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1">{m.name}</span>
                                    <div className="flex justify-end gap-2 md:justify-center">
                                        <ToolTip label="Редагувати">
                                            <button type="button" onClick={() => startEdit(m)} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-50 hover:text-blue-600" aria-label="Редагувати товар">
                                                <MdEdit className="size-5"/>
                                            </button>
                                        </ToolTip>
                                        <ToolTip label="Видалити">
                                            <button type="button" onClick={() => handleDelete(m.id)} className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600" aria-label="Видалити товар">
                                                <FiTrash2 className="size-5"/>
                                            </button>
                                        </ToolTip>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    <div className="flex items-center gap-2 mt-1">
                        <input
                            placeholder="Нова назва матеріалу"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            className={`${inputClass} flex-1 text-sm`}
                        />
                        {/*<ToolTip label="Додати">*/}
                        {/*    <MdAdd*/}
                        {/*        onClick={handleCreate}*/}
                        {/*        className="size-6 md:size-7 text-gray-500 hover:text-green-600 transition cursor-pointer"*/}
                        {/*    />*/}
                        {/*</ToolTip>*/}
                        <ToolTip label="Додати">
                            <button
                                type="button"
                                onClick={handleCreate}
                                aria-label="Додати"
                                className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-800">
                                <MdAdd className={"size-6 md:size-7"} />
                            </button>
                        </ToolTip>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Material;
