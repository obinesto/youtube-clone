"use client";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const SkeletonLoader = () => {
    return (
        <div className="skeleton-loader">
            <Skeleton height={200} />
            <Skeleton height={20} width={200} />
            <Skeleton height={20} width={100} />
        </div>
    )
}

export default SkeletonLoader