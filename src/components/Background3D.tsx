import React from 'react';
import { motion, Transition } from 'framer-motion';

interface Shape {
    id: number;
    type: string;
    initial: { x: string; y: string; rotate?: number; scale?: number };
    animate: any;
    transition: Transition;
    style: React.CSSProperties;
}

export const Background3D = () => {
    // Define shapes with their initial positions and animation properties
    const shapes: Shape[] = [
        {
            id: 1,
            type: 'cube',
            initial: { x: '10vw', y: '20vh', rotate: 0, scale: 1 },
            animate: {
                y: ['18vh', '22vh', '18vh'],
                rotate: [0, 90, 180, 270, 360],
                scale: [1, 1.1, 1],
            },
            transition: {
                duration: 20,
                repeat: Infinity,
                ease: "linear"
            },
            style: {
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                borderRadius: '16px',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            }
        },
        {
            id: 2,
            type: 'orb',
            initial: { x: '80vw', y: '15vh', scale: 1 },
            animate: {
                y: ['15vh', '10vh', '15vh'],
                scale: [1, 1.2, 1],
            },
            transition: {
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
            },
            style: {
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))',
                borderRadius: '50%',
                filter: 'blur(20px)',
            }
        },
        {
            id: 3,
            type: 'pyramid',
            initial: { x: '85vw', y: '75vh', rotate: 45 },
            animate: {
                y: ['75vh', '80vh', '75vh'],
                rotate: [45, 225, 45],
            },
            transition: {
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
            },
            style: {
                width: '120px',
                height: '120px',
                background: 'linear-gradient(45deg, rgba(236, 72, 153, 0.08), rgba(219, 39, 119, 0.02))',
                transform: 'rotate(45deg)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.03)',
            }
        },
        {
            id: 4,
            type: 'cube-sm',
            initial: { x: '15vw', y: '80vh', rotate: 0 },
            animate: {
                y: ['80vh', '70vh', '80vh'],
                rotate: [0, -180, -360],
            },
            transition: {
                duration: 18,
                repeat: Infinity,
                ease: "linear"
            },
            style: {
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                borderRadius: '12px',
                backdropFilter: 'blur(3px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
            }
        },
        {
            id: 5,
            type: 'orb-lg',
            initial: { x: '50vw', y: '50vh', scale: 0.8 },
            animate: {
                scale: [0.8, 1, 0.8],
                opacity: [0.3, 0.5, 0.3],
            },
            transition: {
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
            },
            style: {
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, rgba(0, 0, 0, 0) 70%)',
                borderRadius: '50%',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: -2,
                pointerEvents: 'none'
            }
        }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            zIndex: -1,
            pointerEvents: 'none',
            background: 'var(--bg-primary)' // Ensure base background is set
        }}>
            {shapes.map((shape) => (
                <motion.div
                    key={shape.id}
                    initial={shape.initial}
                    animate={shape.animate}
                    transition={shape.transition}
                    style={{
                        position: 'absolute',
                        left: shape.initial.x as any,
                        top: shape.initial.y as any,
                        ...shape.style
                    }}
                />
            ))}

            {/* Grid Overlay for depth */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
                opacity: 0.5,
                maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
            }} />
        </div>
    );
};
