'use client';

import { FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function Loading() {
    return (
        <AnimatePresence>
            <main className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: 1
                    }}
                    transition={{
                        scale: {
                            repeat: Infinity,
                            duration: 1.2,
                            ease: "easeInOut"
                        },
                        opacity: {
                            duration: 0.2
                        }
                    }}
                    className="flex flex-col items-center justify-center"
                >
                    <FaBell className="text-4xl text-red-600 animate-pulse" />
                </motion.div>
            </main>
        </AnimatePresence>
    );
}
