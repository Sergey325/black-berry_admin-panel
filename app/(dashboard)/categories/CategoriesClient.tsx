"use client"

import {useCallback, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {ICategory} from "@/app/actions/getCategories";
import qs from "query-string";
import AllCategories from "@/app/(dashboard)/categories/components/AllCategories";
import AddCategory from "@/app/(dashboard)/categories/components/AddCategory";
import DashboardPageHeader from "@/app/(dashboard)/components/DashboardPageHeader";

type Props = {
    categories: ICategory[];
};

const CategoriesClient = ({categories}: Props) => {
    const [selectedCategory, setSelectedCategory] = useState<ICategory| null>(null);
    const params = useSearchParams()
    const router = useRouter()

    const tab = useMemo(() => {
        return params?.get("tab") || "AllCategories";
    }, [params])

    const handleChangeTab = useCallback((tabTitle: string) => {
        if (tabTitle === "AllCategories") {
            setSelectedCategory(null)
        }

        if (tab === tabTitle) return null

        let currentQuery = {}

        if(params){
            currentQuery = qs.parse(params.toString())
        }

        const updatedQuery = {
            ...currentQuery,
            tab: tabTitle
        }

        const url = qs.stringifyUrl({
            url: '/categories/',
            query: updatedQuery
        }, {skipNull: true})

        router.push(url)
    }, [params, router, tab])

    const onEditCategory = (category: ICategory) => {
        setSelectedCategory(category)
        handleChangeTab("AddCategory")
    }

    return (
        <main className="py-6 md:py-10">
            <DashboardPageHeader
                title={tab === "AllCategories" ? "Категорії" : selectedCategory ? "Редагування категорії" : "Нова категорія"}
                description={tab === "AllCategories"
                    ? "Організуйте каталог і керуйте відображенням колекцій"
                    : selectedCategory ? `Оновіть оформлення категорії «${selectedCategory.name}»` : "Створіть новий розділ каталогу"}
            />
            <div className="mt-7">
            {
                tab === "AllCategories" ? <AllCategories categories={categories} onEdit={onEditCategory} handleChangeTab={handleChangeTab}/> : <AddCategory category={selectedCategory || undefined} resetSelectedCategory={() => setSelectedCategory(null)}/>
            }
            </div>
        </main>
    );
};

export default CategoriesClient;
