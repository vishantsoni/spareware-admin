import SignInForm from '@/components/auth/SignInForm'
import React from 'react'

const page = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 ">
            <div className="min-h-screen flex flex-col p-5">
                <div className="flex flex-1">
                    <SignInForm />
                </div>
            </div>
        </div>
    )
}

export default page
