import { div } from "framer-motion/client"



function TopupPage() {
    return (
        <div className=" mx-auto px-4">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold mb-4">เติมเงิน</h1>
                <div className="border border-gray-300 rounded-lg p-4 text-center  bg-white  " >
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

    <img 
        src="https://i.ytimg.com/vi/3lB4Onf9QU4/mqdefault.jpg"
        className="w-full h-40 object-cover rounded"
    />

    <img 
        src="https://thethaiger.com/wp-content/uploads/2023/08/Kasikornbank-Restructuring.jpg"
        className="w-full h-40 object-cover rounded"
    />

    <img 
        src="https://th.bing.com/th/id/OIP.fTvdLtNTp75zApGpWilIwAHaCk?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3"
        className="w-full h-40 object-cover rounded"
    />

</div>


                </div>

<div className="border border-gray-300 rounded-lg mt-4 pt-4 pb-2 text-center bg-white flex flex-col items-center ">
    <h2 className="text-2xl font-bold mb-4">ช่องทางการเติมเงิน</h2>

    <img src="https://us-east-1.tixte.net/uploads/bananashop.tixte.co/%E0%B8%B3%E0%B8%94%E0%B8%B3%E0%B8%94%E0%B8%B3%E0%B8%94%E0%B8%B3%E0%B8%94.jpg" alt="" className="w-150 h-auto object-cover rounded  mx-auto  " />
    <input type="text" className="mt-4 p-2 border border-gray-300 rounded w-200  text-center mx-auto" placeholder="กรอกลิ้ง" />

    <button className="mt-4 p-2 bg-blue-500 text-white rounded w-200">ยืนยัน</button>
</div>
            </div>
        </div>
    )

}

export default TopupPage