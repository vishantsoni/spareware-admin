import ProductTable from '@/components/products/ProductTable'
import React from 'react'

const page = () => {
    return (
        <div>
            <div className='mb-4'>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product List</h1>
                {/* <p className="text-gray-500 dark:text-gray-400">Manage your downline members and their details</p> */}
            </div>
            <ProductTable />
        </div>
    )
}

export default page
