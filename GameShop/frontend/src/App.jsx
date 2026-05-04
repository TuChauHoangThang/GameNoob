import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StorePage from './pages/StorePage';
import './App.css';

export default function App() {
  return (
    <div className="app-root">
      <Navbar />
      <StorePage />
      <Footer />
    </div>
  );
}
