import { AppStoreProvider } from './store/store';
import { MapView } from './map/MapView';
import { Timeline } from './timeline/Timeline';
import { TimeSeriesChart } from './charts/TimeSeriesChart';
import { LayerPanel } from './components/LayerPanel';

export default function App() {
  return (
    <AppStoreProvider>
      <div className="app">
        <aside className="app__sidebar">
          <LayerPanel />
        </aside>
        <main className="app__main">
          <div className="app__map">
            <MapView />
          </div>
          <div className="app__bottom">
            <Timeline />
            <TimeSeriesChart />
          </div>
        </main>
      </div>
    </AppStoreProvider>
  );
}
