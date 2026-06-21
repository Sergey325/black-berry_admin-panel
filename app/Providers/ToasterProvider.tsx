'use client'

import {Toaster} from "react-hot-toast";

const ToasterProvider = () => {
    return (
        <div className="text-base">
            <Toaster toastOptions={{
                // style: {
                //     background: "#ffffff",
                //     color: "#823D9A",
                //     borderColor: "#823D9A",
                // },
                className:"shadow-xl select-none",
                duration: 3000,
            }}/>
        </div>
    )
}

export default ToasterProvider;