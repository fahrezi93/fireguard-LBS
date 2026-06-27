'use client';

import { FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function Loading() {
    return (
        <AnimatePresence>
            <main className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: 1
                    }}
                    transition={{
                        scale: {
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "easeInOut"
                        },
                        opacity: {
                            duration: 0.3
                        }
                    }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="p-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-xl shadow-red-500/20">
                        <FaBell className="text-4xl text-white" />
                    </div>
                </motion.div>
            </main>
        </AnimatePresence>
    );
}
