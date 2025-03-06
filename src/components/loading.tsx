export default function Loading() {
    return (
        <div className="absolute left-1/2 top-[38%] transform -translate-x-1/2 -translate-y-1/2">
            <div
                className="relative w-11 h-11 animate-spinner [transform-style:preserve-3d]"
            >
                <div className="absolute w-full h-full bg-[rgba(0,77,255,0.2)] border-2 border-[#004dff] [transform:translateZ(-22px)_rotateY(180deg)]"></div>
                <div className="absolute w-full h-full bg-[rgba(0,77,255,0.2)] border-2 border-[#004dff] [transform:rotateY(-270deg)_translateX(50%)] [transform-origin:top_right]"></div>
                <div className="absolute w-full h-full bg-[rgba(0,77,255,0.2)] border-2 border-[#004dff] [transform:rotateY(270deg)_translateX(-50%)] [transform-origin:center_left]"></div>
                <div className="absolute w-full h-full bg-[rgba(0,77,255,0.2)] border-2 border-[#004dff] [transform:rotateX(90deg)_translateY(-50%)] [transform-origin:top_center]"></div>
                <div className="absolute w-full h-full bg-[rgba(0,77,255,0.2)] border-2 border-[#004dff] [transform:rotateX(-90deg)_translateY(50%)] [transform-origin:bottom_center]"></div>
                <div className="absolute w-full h-full bg-[rgba(0,77,255,0.2)] border-2 border-[#004dff] [transform:translateZ(22px)]"></div>
            </div>
        </div>
    );
}