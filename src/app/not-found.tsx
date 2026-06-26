import Link from 'next/link';
import { FaFire, FaArrowLeft } from 'react-icons/fa';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4 text-center">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-600/[0.03] rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Logo Icon */}
                <div className="mb-8 p-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-xl shadow-red-500/20">
                    <FaFire className="text-4xl text-white" />
                </div>

                {/* 404 Text */}
                <h1 className="text-8xl md:text-9xl font-black text-neutral-900 mb-2 tracking-tighter">
                    404
                </h1>

                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
                    Halaman Tidak Ditemukan
                </h2>

                <p className="text-neutral-500 max-w-md mb-10 leading-relaxed font-medium">
                    Maaf, halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.
                    Pastikan alamat URL sudah benar.
                </p>

                {/* Action Button */}
                <Link
                    href="/"
                    className="group flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-black/20"
                >
                    <FaArrowLeft className="text-sm transition-transform group-hover:-translate-x-1" />
                    Kembali ke Beranda
                </Link>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-8 text-neutral-400 text-xs font-bold tracking-widest uppercase">
                SiagaBencana &copy; {new Date().getFullYear()}
            </div>
        </div>
    );
}
