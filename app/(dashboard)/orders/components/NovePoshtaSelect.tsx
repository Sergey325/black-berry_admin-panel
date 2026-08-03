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

    // Поиск городов с debounce
    useEffect(() => {
        if (cityQuery.length < 2) return;

        const timeout = setTimeout(async () => {
            try {
                const res = await axios.post("/api/cities", {
                    query: cityQuery,
                });
                console.log(res);
                setCities(res.data);
            } catch (e) {
                console.error(e);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [cityQuery]);
    //
    // Загрузка отделений после выбора города
    useEffect(() => {
        if (!selectedCity) return;
        axios.post("/api/warehouses", { cityRef: selectedCity.ref }).then((res) => {
            setWarehouses(res.data);
        }).then(() => setIsLoading(false));
    }, [selectedCity]);

    return (
        <div className="flex flex-col text-base gap-4 border-2 border-gray-200 rounded-md p-6 bg-white">
            {/* Выбор города */}
            <div>
                <label className="block mb-1 font-medium transition">Виберіть місто*</label>
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
                        className="w-full border border-gray-200 rounded-md px-4 py-3"
                    />
                    {cities.length > 0 && !selectedCity && (
                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-60 overflow-auto">
                            {cities.map((city) => (
                                <div
                                    key={city.ref}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                        console.log(city)
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

            {/* Выбор отделения */}
            <div ref={wrapperRef} className="text-base relative">
                <label className="block mb-1 font-medium">
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
                    className="w-full border border-gray-200 rounded-md px-4 py-3 pr-10 mb-2"
                />

                {/* КРЕСТИК */}
                {selectedWarehouse && (
                    <button
                        onClick={() => {
                            setSelectedWarehouse(null);
                            setWarehouseQuery("");
                            setIsWarehousesOpen(false);
                        }}
                        className="absolute right-3 top-[45px] text-gray-400 hover:text-gray-600 cursor-pointer"
                        type="button"
                    >
                        <FiX size={25} />
                    </button>
                )}

                {/* СПИСОК */}
                {isWarehousesOpen && !selectedWarehouse && (
                    <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">

                        {filteredWarehouses.map((w) => (
                            <div
                                key={w.ref}
                                onClick={() => {
                                    console.log(w)
                                    setSelectedWarehouse(w);
                                    setWarehouseQuery(w.description);
                                    setIsWarehousesOpen(false);
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
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