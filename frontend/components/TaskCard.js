import React from 'react';

const TaskCard = ({ taskNumber, status, onClick, isLocked, adData }) => {
    // adData: { title, imageUrl, ... }

    const isCompleted = status === 'completed';

    // Neon Colors
    const borderColor = isCompleted ? '#00ff9d' : isLocked ? '#444' : '#00ccff';
    const shadowColor = isCompleted ? 'rgba(0, 255, 157, 0.5)' : isLocked ? 'none' : 'rgba(0, 204, 255, 0.5)';

    return (
        <div
            onClick={!isLocked && !isCompleted ? onClick : null}
            className={`
                relative h-64 rounded-3xl overflow-hidden border-2 transition-all duration-300 group
                ${!isLocked && !isCompleted ? 'cursor-pointer hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_20px_var(--shadow-color)]' : ''}
                ${isLocked ? 'opacity-80' : 'opacity-100'}
            `}
            style={{
                borderColor: borderColor,
                '--shadow-color': shadowColor,
                background: '#000',
            }}
        >
            {/* Background Image */}
            <div className="absolute inset-0 bg-gray-900">
                {adData?.imageUrl ? (
                    <img
                        src={adData.imageUrl}
                        alt={adData.title}
                        className={`w-full h-full object-cover transition-transform duration-700 ${!isLocked ? 'group-hover:scale-110' : 'grayscale'}`}
                    />
                ) : (
                    // Fallback Placeholder if no image
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600 font-bold text-4xl">
                        {taskNumber}
                    </div>
                )}
            </div>

            {/* Overlays */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent ${isLocked ? 'bg-black/60 backdrop-blur-[2px]' : ''}`}></div>

            {/* Content */}
            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                {/* Top Badge */}
                <div className="flex justify-between items-start">
                    <div className={`
                        px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md
                        ${isCompleted ? 'bg-green-500/20 border-green-500 text-green-400' :
                            isLocked ? 'bg-gray-800/50 border-gray-600 text-gray-400' :
                                'bg-blue-500/20 border-blue-400 text-blue-300'}
                    `}>
                        {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Task ' + taskNumber}
                    </div>

                    {isCompleted && (
                        <div className="bg-green-500/20 p-2 rounded-full border border-green-500 text-green-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    )}
                    {isLocked && (
                        <div className="bg-gray-800/50 p-2 rounded-full border border-gray-600 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                    )}
                </div>

                {/* Bottom Title */}
                <div className="transform translate-y-0 transition-transform duration-300">
                    <h3 className={`font-bold text-lg leading-tight mb-1 ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                        {adData?.title || `Task #${taskNumber}`}
                    </h3>
                    {!isLocked && !isCompleted && (
                        <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                            Tap to Start <span className="text-lg">›</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Neon Border Glow Effect */}
            {!isLocked && !isCompleted && (
                <div className="absolute inset-0 rounded-3xl ring-2 ring-transparent group-hover:ring-cyan-400/50 transition-all duration-500"></div>
            )}
        </div>
    );
};

export default TaskCard;
