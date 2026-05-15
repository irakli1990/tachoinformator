import { useState } from 'preact/hooks';

import ListView from './views/ListView';
import DetailView from './views/DetailView';

export default function App() {
  const [view, setView] = useState('list');

  return (
    <>
      {view === 'list' && (
        <ListView onOpenDetail={() => setView('detail')} />
      )}

      {view === 'detail' && (
        <DetailView onBack={() => setView('list')} />
      )}
    </>
  );
}