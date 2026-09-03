import {useState, useEffect, useMemo, useRef, SetStateAction, Dispatch} from "react";
import axios from "axios";
import useClickOutside from "@/app/hooks/useClickOutside";
import {FiX} from "react-icons/fi";
import {City, Warehouse} from "@/app/types";

type Props = {
    selectedCity: City | null;
    setSelectedCity: Dispatch<SetStateAction<City | null>>;
    selectedWarehouse: Warehouse | null;
    setSelectedWarehouse: Dispatch<SetStateAction<Warehouse | null>>;
}

export default function NovaPoshtaSelect({ selectedCity, setSelectedCity, selectedWarehouse, setSelectedWarehouse }: Props) {
    const [cityQuery, setCityQuery] = useState("");
    const [cities, setCities] = useState<City[]>([]);

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [warehouseQuery, setWarehouseQuery] = useState("");

    const filteredWarehouses = useMemo(() => {
        return warehouses.filter((w) =>
            w.description.toLowerCase().includes(warehouseQuery.toLowerCase())
        );
    }, [warehouses, warehouseQuery]);

    const [isWarehousesOpen, setIsWarehousesOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false)

    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useClickOutside({
        ref: wrapperRef,
        onClickOutside: () => setIsWarehousesOpen(false),
    });

    useEffect(() => {
        if (cityQuery.length < 2) return;

        const timeout = setTimeout(async () => {
            try {
                const res = await axios.post("/api/cities", {
                    query: cityQuery,
                });
                setCities(res.data);
            } catch (e) {
                console.error(e);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [cityQuery]);
    useEffect(() => {
        if (!selectedCity) return;
        axios.post("/api/warehouses", { cityRef: selectedCity.ref }).then((res) => {
            setWarehouses(res.data);
        }).then(() => setIsLoading(false));
    }, [selectedCity]);

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div>
                <label className="mb-1 block text-base font-medium text-gray-700">Виберіть місто</label>
                <div className="relative transition">
                    <input
                        type="text"
                        value={selectedCity ? selectedCity.name : cityQuery}
                        onChange={(e) => {
                            const value = e.target.value;

                            setCityQuery(value);
                            setSelectedCity(null);

                            if (value.length < 2) {
                                setCities([]);
                            }
                        }}
                        placeholder="Виберіть місто"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                    />
                    {cities.length > 0 && !selectedCity && (
                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                            {cities.map((city) => (
                                <div
                                    key={city.ref}
                                    className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                                    onClick={() => {
                                        setSelectedCity(city);
                                        setIsLoading(true)
                                        setCities([]);
                                        setWarehouses([]);
                                        setSelectedWarehouse(null);
                                        setWarehouseQuery("");
                                    }}
                                >
                                    {city.name} <span className="text-gray-400 text-sm">{city.area}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div ref={wrapperRef} className="text-base relative">
                <label className="mb-1 block text-base font-medium text-gray-700">
                    Виберіть відділення
                </label>

                <input
                    type="text"
                    value={selectedWarehouse ? selectedWarehouse.description : warehouseQuery}
                    onChange={(e) => {
                        setWarehouseQuery(e.target.value);
                        setSelectedWarehouse(null);
                        setIsWarehousesOpen(true);
                    }}
                    onFocus={() => setIsWarehousesOpen(true)}
                    placeholder="Пошук відділення..."
                    disabled={!selectedCity}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-base focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
                />

                {selectedWarehouse && (
                    <button
                        onClick={() => {
                            setSelectedWarehouse(null);
                            setWarehouseQuery("");
                            setIsWarehousesOpen(false);
                        }}
                        className="absolute right-3 top-[35px] cursor-pointer text-gray-400 hover:text-gray-600"
                        type="button"
                    >
                        <FiX size={25} />
                    </button>
                )}

                {isWarehousesOpen && !selectedWarehouse && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">

                        {filteredWarehouses.map((w) => (
                            <div
                                key={w.ref}
                                onClick={() => {
                                    setSelectedWarehouse(w);
                                    setWarehouseQuery(w.description);
                                    setIsWarehousesOpen(false);
                                }}
                                className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                            >
                                {w.description}
                            </div>
                        ))}

                        {filteredWarehouses.length === 0 && selectedCity && !isLoading && (
                            <div className="px-4 py-2 text-gray-400">
                                Нічого не знайдено
                            </div>
                        )}

                    </div>
                )}
            </div>

        </div>
    );
}
