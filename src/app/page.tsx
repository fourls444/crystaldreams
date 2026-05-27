import Header from "@/components/Header/Header";
import ProductDetail from "@/components/ProductDetail/ProductDetail";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between font-sans">
      <Header />
      <ProductDetail />
      <Footer />
    </div>
  );
}
