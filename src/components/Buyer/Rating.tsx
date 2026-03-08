import { Star } from "lucide-react";

export default function Rating({
                                   value = 4.8,
                                   total = 128,
                                   size = 16,
                                   showText = true,
                               }) {
    const fullStars = Math.floor(value);
    const hasHalf = value - fullStars >= 0.5;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => {
                    const isFull = index < fullStars;
                    const isHalf = index === fullStars && hasHalf;

                    return (
                        <div
                            key={index}
                            className="relative"
                            style={{ width: size, height: size }}
                        >
                            <Star
                                size={size}
                                className="absolute inset-0 text-gray-300 fill-gray-300"
                            />
                            {(isFull || isHalf) && (
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: isHalf ? `${size / 2}px` : `${size}px` }}
                                >
                                    <Star
                                        size={size}
                                        className="text-yellow-400 fill-yellow-400"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showText && (
                <div className="flex items-center gap-1 text-sm">
                    <span className="font-semibold text-gray-800">{value}</span>
                    <span className="text-gray-400">({total} đánh giá)</span>
                </div>
            )}
        </div>
    );
}
