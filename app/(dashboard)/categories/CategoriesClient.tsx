"use client"

import {useCallback, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {ICategory} from "@/app/actions/getCategories";
import qs from "query-string";
import AllCategories from "@/app/(dashboard)/categories/components/AllCategories";
import AddCategory from "@/app/(dashboard)/categories/components/AddCategory";

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

        const updatedQuery: any = {
            ...currentQuery,
            tab: tabTitle
        }

        const url = qs.stringifyUrl({
            url: '/categories/',
            query: updatedQuery
        }, {skipNull: true})

        router.push(url)
    }, [params])

    const onEditCategory = (category: ICategory) => {
        setSelectedCategory(category)
        handleChangeTab("AddCategory")
    }

    return (
        <div className="mt-10 ">
            {
                tab === "AllCategories" ? <AllCategories categories={categories} onEdit={onEditCategory} handleChangeTab={handleChangeTab}/> : <AddCategory category={selectedCategory || undefined} resetSelectedCategory={() => setSelectedCategory(null)}/>
            }
        </div>
    );
};

export default CategoriesClient;