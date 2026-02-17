import React from 'react';
import GameClient from './GameClient';

const VALID_THEMES = ['royale', 'classic', 'gems', 'fruits', 'diamonds', 'botanical', 'navy'];

// [STATIC EXPORT SUPPORT]
export async function generateStaticParams() {
    return VALID_THEMES.map((theme) => ({
        theme: theme,
    }));
}

export default async function GamePage(props) {
    // Await params for Next.js 15 Compatibility
    const params = await props.params;
    const { theme } = params;

    return <GameClient theme={theme} />;
}
