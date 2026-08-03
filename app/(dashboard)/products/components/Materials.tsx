"use client";

import {useMemo, useState} from "react";
import { MdEdit, MdCheck, MdClose, MdAdd } from "react-icons/md";
import Dropdown from "@/app/components/DropDown";
import {IMaterial} from "@/app/actions/getMaterials";
import ToolTip from "@/app/components/ToolTip";
import axios from "axios";
import {FiTrash2} from "react-icons/fi";


interface Props {
    materialsList: IMaterial[],
    initialValue?: IMaterial | null,
    onSelectedValueChange: (selectedValue: IMaterial) => void,
}

const inputClass =
    "border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-gray-600 transition text-base";

const Material = ({
    materialsList,
    initialValue,
    onSelectedValueChange,
    // onOptionsChange,
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
    }, [materials]);

    const [newName, setNewName] = useState("");

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");

    const [error, setError] = useState<string | null>(null);

    // const syncUp = (next: MaterialItem[]) => {
    //     setMaterials(next);
    //     onOptionsChange?.(next);
    // };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setError(null);
        try {
            const { data } = await axios.post<IMaterial>("/api/material", {
                name: newName.trim(),
            });
            setMaterials([...materials, data])
            setNewName("");
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Помилка створення");
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
            const { data } = await axios.put(`/api/material/${id}`, {
                name: editingName.trim(),
            });
            setMaterials(prev =>
                prev.map(material =>
                    material.id === id ? data : material
                )
            );
            cancelEdit();
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Помилка редагування");
        }
    };

    const handleDelete = async (id: number) => {
        setError(null);
        try {
            const { data } = await axios.delete<IMaterial>(`/api/material/${id}`);
            setMaterials(materials.filter(m => m.id !== data.id))
        } catch (e: any) {
            setError(e?.response?.data?.error ?? "Помилка видалення");
        }
    };

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="w-full flex gap-2 items-center">
                <Dropdown
                    placeholder={initialValue?.name}
                    options={materialOptions}
                    className=""
                    buttonClassName={"rounded-lg! px-2! sm:px-4! "}
                />
                <ToolTip label="Редагувати матеріали">
                    <MdEdit
                        onClick={() => setMaterialsEdit(!materialsEdit)}
                        className="size-7 text-gray-500 hover:text-blue-600 transition cursor-pointer"
                    />
                </ToolTip>
            </div>

            {materialsEdit && (
                <div className="w-full flex flex-col gap-2 border border-gray-200 rounded-md p-3">
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
                                    <ToolTip label="Зберегти">
                                        <MdCheck
                                            onClick={() => handleUpdate(m.id)}
                                            className="size-6 md:size-7 text-gray-500 hover:text-green-600 transition cursor-pointer"
                                        />
                                    </ToolTip>
                                    <ToolTip label="Скасувати">
                                        <MdClose
                                            onClick={cancelEdit}
                                            className="size-6 md:size-7 text-gray-500 hover:text-red-600 transition cursor-pointer"
                                        />
                                    </ToolTip>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1">{m.name}</span>
                                    <ToolTip label="Редагувати">
                                        <MdEdit
                                            onClick={() => startEdit(m)}
                                            className="size-6 md:size-7 text-gray-500 hover:text-blue-600 transition cursor-pointer"
                                        />
                                    </ToolTip>
                                    <ToolTip label="Видалити">
                                        <FiTrash2
                                            onClick={() => handleDelete(m.id)}
                                            className="size-6 md:size-7 text-gray-500 hover:text-red-600 transition cursor-pointer"
                                        />
                                    </ToolTip>
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
                        <ToolTip label="Додати">
                            <MdAdd
                                onClick={handleCreate}
                                className="size-6 md:size-7 text-gray-500 hover:text-green-600 transition cursor-pointer"
                            />
                        </ToolTip>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Material;

// import Dropdown from "@/app/components/DropDown";
// import ToolTip from "@/app/components/ToolTip";
// import {MdEdit} from "react-icons/md";
// import {useState} from "react";
//
//
// type Props = {
//     options: {
//         value: number
//         label: string
//         onClick: () => void
//     }[],
//     dropDownPlaceHolder?: string
// };
//
// const Material = ({ options, dropDownPlaceHolder = "Виберіть матеріал" }: Props) => {
//     const [materialsEdit, setMaterialsEdit] = useState(false)
//
//     return (
//         <div className="w-full flex flex-col gap-3">
//             <div className="w-full flex gap-2 items-center">
//                 <Dropdown
//                     placeholder={dropDownPlaceHolder}
//                     options={options}
//                     className=""
//                     buttonClassName={"rounded-md! px-2! sm:px-4! "}
//                 />
//                 <ToolTip label="Редагувати матеріали">
//                     <MdEdit
//                         onClick={() => setMaterialsEdit(!materialsEdit)}
//                         className="size-7 text-gray-500 hover:text-blue-600 transition cursor-pointer"
//                     />
//                 </ToolTip>
//             </div>
//             {
//                 materialsEdit &&
//                 <div>
//
//                 </div>
//             }
//         </div>
//
//     );
// };
//
// export default Material;