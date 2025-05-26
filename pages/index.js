import React from 'react';
import BubbleGraph from '../components/BubbleGraph';
import CursorRipple from '../components/CursorRipple';

export default function Home() {
  const data = {
    nodes: [
      { id: '💻', radius: 50 },
      { id: '🌎', radius: 50 },
      { id: '📄', radius: 50 },
      { id: '📷', radius: 50 },
    ],
    // links can be added for forceLink if desired
    links: [],
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      <CursorRipple />
      <h1 className="absolute top-8 left-1/2 transform -translate-x-1/2 text-5xl font-semibold text-white tracking-tight z-10">
        Hello, I'm Alain.
      </h1>
      <BubbleGraph data={data} />
    </div>
  );
}